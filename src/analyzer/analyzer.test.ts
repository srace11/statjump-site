import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MEDIAPIPE_VERSION } from './pose';
import { assessQuality, frameRate } from './quality';
import { pickSubject, type Skeleton } from './subject';
import { rotationFromMatrix } from './video';

function person(hipX: number, hipY: number, size: number): Skeleton {
  return Array.from({ length: 33 }, (_, i) => [hipX + (i % 2 ? size : -size) / 2, hipY + (i % 3 ? size : -size) / 2, 0, 1]);
}

describe('versions', () => {
  it('MEDIAPIPE_VERSION matches the pinned dependency', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.dependencies['@mediapipe/tasks-vision']).toBe(MEDIAPIPE_VERSION);
  });
});

describe('rotationFromMatrix', () => {
  const m = (a: number, b: number, c: number, d: number) => new Int32Array([a, b, 0, c, d, 0, 0, 0, 1 << 30]);
  it('reads the four phone orientations', () => {
    expect(rotationFromMatrix(m(65536, 0, 0, 65536))).toBe(0);
    expect(rotationFromMatrix(m(0, 65536, -65536, 0))).toBe(90);
    expect(rotationFromMatrix(m(-65536, 0, 0, -65536))).toBe(180);
    expect(rotationFromMatrix(m(0, -65536, 65536, 0))).toBe(270);
  });
  it('handles unsigned storage of negative values', () => {
    expect(rotationFromMatrix(new Uint32Array([0, 65536, 0, 0xffff0000, 0, 0, 0, 0, 1 << 30]))).toBe(90);
  });
});

describe('pickSubject', () => {
  it('starts with the largest person', () => {
    expect(pickSubject([person(0.2, 0.5, 0.1), person(0.6, 0.5, 0.4)], null)).toBe(1);
  });
  it('then follows the athlete even when someone larger appears', () => {
    const prev = person(0.3, 0.5, 0.2);
    expect(pickSubject([person(0.8, 0.5, 0.5), person(0.32, 0.5, 0.2)], prev)).toBe(1);
  });
  it('returns -1 when no one is detected', () => {
    expect(pickSubject([], null)).toBe(-1);
  });
});

describe('quality', () => {
  const times = (fps: number, n: number) => Array.from({ length: n }, (_, i) => (i * 1000) / fps);
  it('measures frame rate and dropped frames', () => {
    const t = times(60, 120);
    t.splice(50, 2); // drop two frames
    const fr = frameRate(t);
    expect(fr.median).toBeCloseTo(60, 5);
    expect(fr.worstGap).toBeCloseTo(3, 5);
  });
  it('blocks under 25fps and warns under 50fps', () => {
    expect(assessQuality(times(24, 100), 100, 4).blockers).toHaveLength(1);
    const q30 = assessQuality(times(30, 100), 100, 4);
    expect(q30.blockers).toHaveLength(0);
    expect(q30.warnings[0]).toMatch(/30fps/);
    expect(assessQuality(times(60, 100), 100, 4).warnings).toHaveLength(0);
  });
});
