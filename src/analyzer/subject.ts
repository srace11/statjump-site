// Picks which detected person is the athlete when more than one is in frame.
// Rule: start with the largest person, then follow whoever is closest to
// where the athlete was in the previous frame. Deterministic by design.
// TODO: let the user tap the athlete when the first pick is wrong.

/** [x, y, z, visibility] with x and y normalized to the upright frame. */
export type Point = [number, number, number, number];
export type Skeleton = Point[];

const LEFT_HIP = 23;
const RIGHT_HIP = 24;
/** Max hip movement between frames, as a fraction of frame width, to count as the same person. */
const MAX_JUMP = 0.15;

function hipCenter(s: Skeleton): [number, number] {
  return [(s[LEFT_HIP][0] + s[RIGHT_HIP][0]) / 2, (s[LEFT_HIP][1] + s[RIGHT_HIP][1]) / 2];
}

function area(s: Skeleton): number {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y, , v] of s) {
    if (v < 0.5) continue;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return maxX > minX && maxY > minY ? (maxX - minX) * (maxY - minY) : 0;
}

/** Returns the index of the athlete among the candidates, or -1 if none. */
export function pickSubject(candidates: Skeleton[], previous: Skeleton | null): number {
  if (candidates.length === 0) return -1;
  if (previous) {
    const [px, py] = hipCenter(previous);
    let best = -1;
    let bestDist = MAX_JUMP;
    candidates.forEach((c, i) => {
      const [x, y] = hipCenter(c);
      const d = Math.hypot(x - px, y - py);
      if (d < bestDist) { best = i; bestDist = d; }
    });
    if (best !== -1) return best;
  }
  let largest = 0;
  for (let i = 1; i < candidates.length; i++) {
    if (area(candidates[i]) > area(candidates[largest])) largest = i;
  }
  return largest;
}
