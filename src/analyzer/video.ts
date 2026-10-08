// Frame-exact video reading: demux the file with mp4box and decode every frame
// with WebCodecs. We never seek a <video> element for analysis, because seeking
// can skip or repeat frames and would make results differ between runs.

import {
  createFile, DataStream, Endianness, MP4BoxBuffer,
  type Matrix, type MultiBufferStream, type Sample, type Track, type VisualSampleEntry,
} from 'mp4box';

export type Rotation = 0 | 90 | 180 | 270;

export interface VideoInfo {
  codec: string;
  codedWidth: number;
  codedHeight: number;
  /** Clockwise rotation the container asks players to apply (phones store portrait video this way). */
  rotation: Rotation;
  /** Size after rotation, as the viewer sees it. */
  width: number;
  height: number;
  frameCount: number;
  durationS: number;
}

export interface Demuxed {
  info: VideoInfo;
  config: VideoDecoderConfig;
  samples: Sample[];
}

export function rotationFromMatrix(m: Matrix): Rotation {
  // 16.16 fixed point; `| 0` reads the value as signed whatever the array type.
  const a = (m[0] | 0) / 65536;
  const b = (m[1] | 0) / 65536;
  const quarterTurns = Math.round(Math.atan2(b, a) / (Math.PI / 2));
  return ((((quarterTurns % 4) + 4) % 4) * 90) as Rotation;
}

function codecDescription(entry: VisualSampleEntry): Uint8Array | undefined {
  const box = entry.avcC ?? entry.hvcC ?? entry.vpcC ?? entry.av1C;
  if (!box) return undefined;
  const stream = new DataStream(undefined, 0, Endianness.BIG_ENDIAN);
  box.write(stream as unknown as MultiBufferStream);
  return new Uint8Array(stream.buffer, 8); // skip the box header
}

function samplesDuration(samples: Sample[]): number {
  let start = Infinity, end = -Infinity;
  for (const s of samples) {
    start = Math.min(start, s.cts / s.timescale);
    end = Math.max(end, (s.cts + s.duration) / s.timescale);
  }
  return end - start;
}

/** Parses the whole file at once. Throws if there's no readable video track. */
export function demux(buffer: ArrayBuffer): Demuxed {
  const file = createFile();
  let track: Track | undefined;
  let error: string | undefined;
  const samples: Sample[] = [];

  file.onError = (_module, message) => { error = message; };
  file.onReady = (movie) => {
    track = movie.videoTracks[0];
    if (!track) return;
    file.setExtractionOptions(track.id);
    file.start();
  };
  file.onSamples = (_id, _user, batch) => { for (const s of batch) samples.push(s); };

  file.appendBuffer(MP4BoxBuffer.fromArrayBuffer(buffer, 0), true);
  file.flush();

  if (error) throw new Error(`Couldn't read this video file: ${error}`);
  if (!track || samples.length === 0) throw new Error('No video track found. Upload an .mp4 or .mov file.');

  const entry = samples[0].description as VisualSampleEntry;
  const rotation = rotationFromMatrix(track.matrix);
  const codedWidth = track.video?.width ?? track.track_width;
  const codedHeight = track.video?.height ?? track.track_height;
  const swap = rotation === 90 || rotation === 270;

  return {
    info: {
      codec: track.codec,
      codedWidth,
      codedHeight,
      rotation,
      width: swap ? codedHeight : codedWidth,
      height: swap ? codedWidth : codedHeight,
      frameCount: samples.length,
      // From the samples, not the header: recorded (fragmented) files can leave the header duration at 0.
      durationS: samplesDuration(samples),
    },
    config: { codec: track.codec, codedWidth, codedHeight, description: codecDescription(entry) },
    samples,
  };
}

/**
 * Yields every decoded frame in presentation order. The caller must close()
 * each frame; the decoder stalls if frames pile up unclosed.
 * Frame timestamps are microseconds from the first frame.
 */
export async function* decodeFrames(d: Demuxed): AsyncGenerator<VideoFrame> {
  const support = await VideoDecoder.isConfigSupported(d.config);
  if (!support.supported) {
    throw new Error(`This browser can't decode ${d.info.codec} video. Try Chrome or Safari, or re-export the video as H.264.`);
  }

  const queue: VideoFrame[] = [];
  let failure: Error | null = null;
  let flushed = false;
  let wake: (() => void) | null = null;
  const notify = () => { const w = wake; wake = null; w?.(); };

  const decoder = new VideoDecoder({
    output: (frame) => { queue.push(frame); notify(); },
    error: (e) => { failure = e; notify(); },
  });
  decoder.addEventListener('dequeue', notify);
  decoder.configure(d.config);

  const firstCts = Math.min(...d.samples.map((s) => s.cts));
  let next = 0;

  try {
    while (true) {
      if (failure) throw failure;
      // Keep only a few frames in flight so memory stays flat.
      while (next < d.samples.length && queue.length < 4 && decoder.decodeQueueSize < 8) {
        const s = d.samples[next++];
        decoder.decode(new EncodedVideoChunk({
          type: s.is_sync ? 'key' : 'delta',
          timestamp: Math.round(((s.cts - firstCts) * 1e6) / s.timescale),
          duration: Math.round((s.duration * 1e6) / s.timescale),
          data: s.data!,
        }));
        if (next === d.samples.length) {
          decoder.flush().then(() => { flushed = true; notify(); }, (e) => { failure = e; notify(); });
        }
      }
      if (queue.length > 0) {
        yield queue.shift()!;
        continue;
      }
      if (flushed) break;
      await new Promise<void>((resolve) => { wake = resolve; });
    }
  } finally {
    for (const f of queue) f.close();
    if (decoder.state !== 'closed') decoder.close();
  }
}

/**
 * Draws a frame upright into the canvas, scaled so the long edge is at most
 * maxEdge pixels. Returns the canvas for chaining.
 */
export function drawUpright(frame: VideoFrame, rotation: Rotation, canvas: HTMLCanvasElement, maxEdge: number) {
  const fw = frame.displayWidth;
  const fh = frame.displayHeight;
  const scale = Math.min(1, maxEdge / Math.max(fw, fh));
  const dw = Math.round(fw * scale);
  const dh = Math.round(fh * scale);
  const swap = rotation === 90 || rotation === 270;
  const cw = swap ? dh : dw;
  const ch = swap ? dw : dh;
  if (canvas.width !== cw) canvas.width = cw;
  if (canvas.height !== ch) canvas.height = ch;

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.save();
  ctx.imageSmoothingQuality = 'high';
  if (rotation === 90) { ctx.translate(cw, 0); ctx.rotate(Math.PI / 2); }
  else if (rotation === 180) { ctx.translate(cw, ch); ctx.rotate(Math.PI); }
  else if (rotation === 270) { ctx.translate(0, ch); ctx.rotate(-Math.PI / 2); }
  ctx.drawImage(frame, 0, 0, dw, dh);
  ctx.restore();
  return canvas;
}
