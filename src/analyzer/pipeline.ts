// Video file in, athlete skeleton per frame out, stamped with everything
// needed to reproduce the result.

import { createPoseLandmarker, MEDIAPIPE_VERSION, POSE_MODEL, sha256Hex } from './pose';
import { assessQuality, type QualityReport } from './quality';
import { RUBRIC_VERSION } from './rubric';
import { pickSubject, type Skeleton } from './subject';
import { decodeFrames, demux, drawUpright, type VideoInfo } from './video';

export const ANALYZER_VERSION = '0.1.0';

/** Long edge of the image passed to the pose model. Changing it changes results: bump ANALYZER_VERSION. */
const POSE_INPUT_MAX_EDGE = 1280;

export interface PoseFrame {
  index: number;
  /** Milliseconds from the first frame, from the container timestamps. */
  timeMs: number;
  /** The athlete's 33 landmarks, or null if no one was detected. */
  athlete: Skeleton | null;
  /** How many people were detected in this frame. */
  people: number;
}

export interface AnalysisRun {
  versions: {
    analyzer: string;
    rubric: string;
    poseModel: string;
    poseModelSha256: string;
    mediapipe: string;
  };
  video: VideoInfo & { name: string; sizeBytes: number; sha256: string };
  quality: QualityReport;
  frames: PoseFrame[];
}

export type Progress =
  | { stage: 'reading' | 'loadingModel' }
  | { stage: 'analyzing'; done: number; total: number };

export async function analyzeVideo(file: File, onProgress: (p: Progress) => void): Promise<AnalysisRun> {
  onProgress({ stage: 'reading' });
  const buffer = await file.arrayBuffer();
  const [sha256, demuxed] = [await sha256Hex(buffer), demux(buffer)];

  onProgress({ stage: 'loadingModel' });
  const landmarker = await createPoseLandmarker();

  const canvas = document.createElement('canvas');
  const frames: PoseFrame[] = [];
  let previous: Skeleton | null = null;
  let lastTimeMs = -1;

  try {
    for await (const frame of decodeFrames(demuxed)) {
      const timeMs = frame.timestamp / 1000;
      try {
        // MediaPipe needs strictly increasing timestamps.
        if (timeMs <= lastTimeMs) continue;
        lastTimeMs = timeMs;
        drawUpright(frame, demuxed.info.rotation, canvas, POSE_INPUT_MAX_EDGE);
      } finally {
        frame.close();
      }

      const result = landmarker.detectForVideo(canvas, timeMs);
      const people: Skeleton[] = result.landmarks.map((pose) => pose.map((l) => [l.x, l.y, l.z, l.visibility]));
      const pick = pickSubject(people, previous);
      const athlete = pick >= 0 ? people[pick] : null;
      if (athlete) previous = athlete;
      frames.push({ index: frames.length, timeMs, athlete, people: people.length });

      onProgress({ stage: 'analyzing', done: frames.length, total: demuxed.info.frameCount });
      // Let the page repaint between frames.
      await new Promise((r) => setTimeout(r, 0));
    }
  } finally {
    landmarker.close();
  }

  const detected = frames.filter((f) => f.athlete).length;
  return {
    versions: {
      analyzer: ANALYZER_VERSION,
      rubric: RUBRIC_VERSION,
      poseModel: POSE_MODEL.name,
      poseModelSha256: POSE_MODEL.sha256,
      mediapipe: MEDIAPIPE_VERSION,
    },
    video: { ...demuxed.info, name: file.name, sizeBytes: file.size, sha256 },
    quality: assessQuality(frames.map((f) => f.timeMs), detected, demuxed.info.durationS),
    frames,
  };
}
