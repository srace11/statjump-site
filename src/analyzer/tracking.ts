// Locks onto one person for the whole video.
//
// Pose detection finds everyone in each frame, in no particular order. This
// module follows a single person through those detections: it predicts where
// they should be from their recent speed and accepts only a detection that is
// close to that prediction and about the same size. If no detection fits, the
// frame is left empty. It never falls back to someone else.
//
// Everything here is pure and deterministic, so re-tracking is instant and the
// same seed always gives the same track.

/** [x, y, z, visibility] with x and y normalized to the upright frame. */
export type Point = [number, number, number, number];
export type Skeleton = Point[];

export interface TrackInput {
  timeMs: number;
  people: Skeleton[];
}

/** The detection tracking starts from: person `person` in frame `frame`. */
export interface Seed {
  frame: number;
  person: number;
}

export interface Selection {
  method: 'auto' | 'user';
  seed: Seed;
  /** Per frame, the index of the athlete in that frame's people, or -1. */
  track: number[];
}

const L_SHOULDER = 11, R_SHOULDER = 12, L_HIP = 23, R_HIP = 24;

/** Allowed miss between prediction and detection, in torso lengths. */
const GATE_BASE = 0.8;
const GATE_PER_MISSED_FRAME = 0.15;
const GATE_MAX = 2.0;
/** Torso length may change this much between matches (turning, leaning). */
const MAX_SIZE_CHANGE = 1.8;
/**
 * After this long without a match the person is lost, and tracking stops in
 * that direction. Re-finding them later would risk grabbing someone else who
 * walked into the same spot, so we leave those frames empty instead.
 */
const MAX_GAP_MS = 500;
/** How often to start candidate tracks when choosing the spiker automatically. */
const AUTO_SEED_EVERY = 10;

interface Body {
  /** Torso center, in frame heights. */
  cx: number;
  cy: number;
  /** Shoulder-to-hip length, in frame heights. */
  size: number;
}

/** Torso center and size. `aspect` (width / height) makes x and y the same units. */
export function body(s: Skeleton, aspect: number): Body | null {
  const sx = (s[L_SHOULDER][0] + s[R_SHOULDER][0]) / 2;
  const sy = (s[L_SHOULDER][1] + s[R_SHOULDER][1]) / 2;
  const hx = (s[L_HIP][0] + s[R_HIP][0]) / 2;
  const hy = (s[L_HIP][1] + s[R_HIP][1]) / 2;
  const size = Math.hypot((sx - hx) * aspect, sy - hy);
  if (!(size > 1e-3)) return null;
  return { cx: ((sx + hx) / 2) * aspect, cy: (sy + hy) / 2, size };
}

function followOneWay(frames: TrackInput[], seed: Seed, dir: 1 | -1, aspect: number, out: number[]) {
  let last = body(frames[seed.frame].people[seed.person], aspect)!;
  let lastT = frames[seed.frame].timeMs;
  let lastIndex = seed.frame;
  let vx = 0, vy = 0; // frame heights per ms
  let size = last.size;

  for (let i = seed.frame + dir; i >= 0 && i < frames.length; i += dir) {
    const t = frames[i].timeMs;
    if (Math.abs(t - lastT) > MAX_GAP_MS) break;
    const px = last.cx + vx * (t - lastT);
    const py = last.cy + vy * (t - lastT);
    const missed = Math.abs(i - lastIndex) - 1;
    const gate = Math.min(GATE_MAX, GATE_BASE + GATE_PER_MISSED_FRAME * missed);

    let best = -1;
    let bestCost = gate;
    let bestBody: Body | null = null;
    frames[i].people.forEach((p, j) => {
      const b = body(p, aspect);
      if (!b) return;
      const ratio = b.size / size;
      if (ratio > MAX_SIZE_CHANGE || ratio < 1 / MAX_SIZE_CHANGE) return;
      const cost = Math.hypot(b.cx - px, b.cy - py) / size + 0.5 * Math.abs(Math.log(ratio));
      if (cost < bestCost) { best = j; bestCost = cost; bestBody = b; }
    });

    out[i] = best;
    if (bestBody) {
      const b: Body = bestBody;
      const dt = t - lastT;
      // Blend new speed with the old one so a single noisy detection can't swing it.
      vx = 0.5 * vx + 0.5 * ((b.cx - last.cx) / dt);
      vy = 0.5 * vy + 0.5 * ((b.cy - last.cy) / dt);
      size = 0.7 * size + 0.3 * b.size;
      last = b;
      lastT = t;
      lastIndex = i;
    }
  }
}

/** Follows the seeded person forward and backward through the whole video. */
export function trackFrom(frames: TrackInput[], seed: Seed, aspect: number): number[] {
  const out = new Array<number>(frames.length).fill(-1);
  if (!body(frames[seed.frame]?.people[seed.person] ?? [], aspect)) return out;
  out[seed.frame] = seed.person;
  followOneWay(frames, seed, 1, aspect, out);
  followOneWay(frames, seed, -1, aspect, out);
  return out;
}

function percentile(sorted: number[], q: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

/**
 * How much a track looks like a spike approach: the person rises (jump),
 * travels sideways (approach) and stays in view. Bystanders and blockers
 * mostly stand, so they score low.
 */
export function spikeScore(frames: TrackInput[], track: number[], aspect: number): number {
  const bodies: Body[] = [];
  track.forEach((p, i) => {
    if (p < 0) return;
    const b = body(frames[i].people[p], aspect);
    if (b) bodies.push(b);
  });
  if (bodies.length < 3) return 0;
  const size = percentile(bodies.map((b) => b.size).sort((a, b) => a - b), 0.5);
  const ys = bodies.map((b) => b.cy).sort((a, b) => a - b);
  const xs = bodies.map((b) => b.cx).sort((a, b) => a - b);
  // Robust percentiles so one bad detection can't fake a jump.
  const jump = (percentile(ys, 0.5) - percentile(ys, 0.03)) / size;
  const travel = (percentile(xs, 0.97) - percentile(xs, 0.03)) / size;
  const coverage = bodies.length / frames.length;
  return 3 * Math.min(jump, 2) + 0.5 * Math.min(travel, 6) + 2 * coverage;
}

/** Picks the person most likely to be the spiker. Null if no one was detected. */
export function autoSelect(frames: TrackInput[], aspect: number): Selection | null {
  let best: Selection | null = null;
  let bestScore = -Infinity;
  const tracks: number[][] = [];

  for (let f = 0; f < frames.length; f++) {
    const seeding = f % AUTO_SEED_EVERY === 0;
    frames[f].people.forEach((_, person) => {
      // Seed on a regular grid, plus the first frame anyone appears in.
      if (!seeding && tracks.length > 0) return;
      if (tracks.some((t) => t[f] === person)) return; // already followed
      const seed = { frame: f, person };
      const track = trackFrom(frames, seed, aspect);
      tracks.push(track);
      const score = spikeScore(frames, track, aspect);
      if (score > bestScore) { best = { method: 'auto', seed, track }; bestScore = score; }
    });
  }
  return best;
}

/** Number of frames the athlete was found in. */
export const athleteFrames = (s: Selection | null) => (s ? s.track.filter((p) => p >= 0).length : 0);

/** Follows the person the user tapped. */
export function userSelect(frames: TrackInput[], seed: Seed, aspect: number): Selection {
  return { method: 'user', seed, track: trackFrom(frames, seed, aspect) };
}

/**
 * Which detected person is at a tapped point (normalized x, y)? Picks the
 * nearest torso among people whose outline contains the point. -1 if none.
 */
export function personAt(people: Skeleton[], x: number, y: number, aspect: number): number {
  let best = -1;
  let bestDist = Infinity;
  people.forEach((s, i) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py, , v] of s) {
      if (v < 0.3) continue;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
    // Pad the outline so a tap just outside a thin limb still counts.
    const pad = 0.1 * (maxY - minY);
    if (x < minX - pad || x > maxX + pad || y < minY - pad || y > maxY + pad) return;
    const b = body(s, aspect);
    if (!b) return;
    const d = Math.hypot(x * aspect - b.cx, y - b.cy);
    if (d < bestDist) { best = i; bestDist = d; }
  });
  return best;
}
