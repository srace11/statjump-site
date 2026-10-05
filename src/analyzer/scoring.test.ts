import { describe, expect, it } from 'vitest';
import type { Profile } from './profile';
import { METRICS } from './rubric';
import { interpolate, scoreAll } from './scoring';

const profile: Profile = {
  heightM: 1.85,
  standingReachM: null,
  norms: 'men',
  level: 'elite',
  hand: 'right',
  net: 'men',
};

describe('rubric', () => {
  it('overall weights sum to 1', () => {
    expect(METRICS.reduce((t, m) => t + m.weight, 0)).toBeCloseTo(1, 10);
  });

  it('every metric has component weights summing to 1 and sorted anchors', () => {
    for (const m of METRICS) {
      expect(m.components.reduce((t, c) => t + c.weight, 0)).toBeCloseTo(1, 10);
      for (const c of m.components) {
        const lists = c.scale.kind === 'anchors' ? [c.scale.anchors]
          : c.scale.kind === 'normed' ? Object.values(c.scale.anchors) : [];
        for (const a of lists) {
          for (let i = 1; i < a.length; i++) expect(a[i][0]).toBeGreaterThan(a[i - 1][0]);
        }
      }
    }
  });
});

describe('interpolate', () => {
  const anchors = [[70, 2], [85, 6], [100, 10], [120, 10], [135, 6], [150, 2]] as const;
  it('clamps outside the anchors', () => {
    expect(interpolate(anchors, 40)).toBe(2);
    expect(interpolate(anchors, 170)).toBe(2);
  });
  it('is flat inside an ideal band and linear between anchors', () => {
    expect(interpolate(anchors, 110)).toBe(10);
    expect(interpolate(anchors, 92.5)).toBeCloseTo(8, 10);
    expect(interpolate(anchors, 142.5)).toBeCloseTo(4, 10);
  });
});

describe('scoreAll', () => {
  it('scales outcome norms by level but not technique', () => {
    const m = {
      vertical: { jumpHeight: { value: 0.54, confidence: 'high' as const } },
      kneeLoad: { kneeAngle: { value: 110, confidence: 'high' as const } },
    };
    const elite = scoreAll(m, profile);
    const youth = scoreAll(m, { ...profile, level: 'youth' });
    // 0.54m is the youth 10/10 anchor (0.90 × 0.6).
    expect(elite.metrics.find((x) => x.id === 'vertical')!.score).toBe(5.2);
    expect(youth.metrics.find((x) => x.id === 'vertical')!.score).toBe(10);
    expect(youth.metrics.find((x) => x.id === 'kneeLoad')!.score).toBe(
      elite.metrics.find((x) => x.id === 'kneeLoad')!.score,
    );
  });

  it('skips a metric when under half its weight was measured, and marks the overall partial', () => {
    const card = scoreAll({ armSwing: { bowAndArrow: { value: 8, confidence: 'high' } } }, profile);
    expect(card.metrics.find((x) => x.id === 'armSwing')!.score).toBeNull();
    expect(card.overall).toBeNull();
    expect(card.partial).toBe(true);
  });

  it('rescales weights over measured components and takes the lowest confidence', () => {
    const card = scoreAll({
      armSwing: {
        bowAndArrow: { value: 8, confidence: 'high' },
        backswingRange: { value: 60, confidence: 'medium' },
      },
    }, profile);
    const arm = card.metrics.find((x) => x.id === 'armSwing')!;
    expect(arm.score).toBe(9);
    expect(arm.confidence).toBe('medium');
  });

  it('applies guardrail caps', () => {
    const card = scoreAll({ groundContact: { plantContact: { value: 0.2, confidence: 'high' } } }, profile, { groundContact: 6 });
    const gct = card.metrics.find((x) => x.id === 'groundContact')!;
    expect(gct.score).toBe(6);
    expect(gct.capped).toBe(true);
  });

  it('gives identical output for identical input', () => {
    const m = { vertical: { jumpHeight: { value: 0.6123, confidence: 'high' as const } } };
    expect(JSON.stringify(scoreAll(m, profile))).toBe(JSON.stringify(scoreAll(m, profile)));
  });
});
