import { describe, expect, it } from 'vitest';
import { autoSelect, personAt, trackFrom, userSelect, type Skeleton, type TrackInput } from './tracking';

/** A standing figure with torso center (cx, cy) and torso length `size`, in frame units. */
function figure(cx: number, cy: number, size: number): Skeleton {
  const s: Skeleton = Array.from({ length: 33 }, () => [cx, cy, 0, 1]);
  const set = (i: number, x: number, y: number) => { s[i] = [x, y, 0, 1]; };
  set(11, cx - size * 0.2, cy - size / 2); set(12, cx + size * 0.2, cy - size / 2); // shoulders
  set(23, cx - size * 0.15, cy + size / 2); set(24, cx + size * 0.15, cy + size / 2); // hips
  set(0, cx, cy - size * 0.95); // nose
  set(27, cx - size * 0.15, cy + size * 1.6); set(28, cx + size * 0.15, cy + size * 1.6); // ankles
  return s;
}

const N = 60;
/** Spiker approaches left to right for 40 frames, then jumps. */
function spikerAt(i: number) {
  const x = 0.15 + Math.min(i, 40) * 0.01;
  const rise = i > 40 && i < 56 ? 0.15 * Math.sin(((i - 40) / 16) * Math.PI) : 0;
  return figure(x, 0.6 - rise, 0.12);
}
/** A larger bystander standing still nearer the camera. */
const bystander = figure(0.8, 0.55, 0.18);

/** Builds frames, swapping detector order on odd frames like a real detector would. */
function scene(opts: { missing?: (i: number) => boolean } = {}): TrackInput[] {
  return Array.from({ length: N }, (_, i) => {
    const people = opts.missing?.(i) ? [bystander] : [spikerAt(i), bystander];
    return { timeMs: (i * 1000) / 60, people: i % 2 ? [...people].reverse() : people };
  });
}
const isSpiker = (frames: TrackInput[], i: number, p: number) => p >= 0 && frames[i].people[p][11][0] < 0.7;

describe('tracking', () => {
  it('auto-selects the spiker over a larger bystander and keeps them every frame', () => {
    const frames = scene();
    const sel = autoSelect(frames, 1)!;
    expect(sel.method).toBe('auto');
    sel.track.forEach((p, i) => expect(isSpiker(frames, i, p)).toBe(true));
  });

  it('leaves frames empty when the athlete is missing instead of switching people', () => {
    const frames = scene({ missing: (i) => i >= 20 && i < 26 });
    const sel = autoSelect(frames, 1)!;
    sel.track.forEach((p, i) => {
      if (i >= 20 && i < 26) expect(p).toBe(-1);
      else expect(isSpiker(frames, i, p)).toBe(true);
    });
  });

  it('stops following after a long disappearance instead of grabbing whoever shows up there', () => {
    // The spiker is hidden for 0.6s; then a same-sized person shows up exactly
    // where the spiker would have been.
    const frames: TrackInput[] = Array.from({ length: N }, (_, i) => ({
      timeMs: (i * 1000) / 60,
      people: i < 20 ? [spikerAt(i)] : i < 56 ? [] : [spikerAt(i)],
    }));
    const track = trackFrom(frames, { frame: 5, person: 0 }, 1);
    track.forEach((p, i) => expect(p).toBe(i < 20 ? 0 : -1));
  });

  it('follows the person the user picked, from any frame', () => {
    const frames = scene();
    const tapped = frames[30].people.indexOf(bystander);
    const sel = userSelect(frames, { frame: 30, person: tapped }, 1);
    expect(sel.method).toBe('user');
    sel.track.forEach((p, i) => expect(frames[i].people[p]).toBe(bystander));
  });

  it('gives the same track for the same seed', () => {
    const frames = scene();
    expect(trackFrom(frames, { frame: 5, person: 0 }, 1)).toEqual(trackFrom(frames, { frame: 5, person: 0 }, 1));
  });

  it('returns null when no one is detected', () => {
    expect(autoSelect([{ timeMs: 0, people: [] }], 1)).toBeNull();
  });
});

describe('personAt', () => {
  const people = [figure(0.3, 0.5, 0.1), figure(0.7, 0.5, 0.1)];
  it('finds the person under a tap', () => {
    expect(personAt(people, 0.31, 0.5, 1)).toBe(0);
    expect(personAt(people, 0.69, 0.62, 1)).toBe(1);
  });
  it('returns -1 for a tap on empty floor', () => {
    expect(personAt(people, 0.5, 0.1, 1)).toBe(-1);
  });
});
