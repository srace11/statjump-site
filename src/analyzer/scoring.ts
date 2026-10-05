// Turns measurements into 0–10 scores using the rubric. Pure and deterministic:
// no randomness, no learned weights, rounding only at the very end.

import { LEVELS, type Profile } from './profile';
import { METRICS, MIN_MEASURED_WEIGHT, type Anchor, type ComponentDef, type MetricId } from './rubric';

export type Confidence = 'high' | 'medium' | 'low';

export interface Measurement {
  value: number;
  confidence: Confidence;
}

/** metric id -> component id -> measurement (missing or null = not measured). */
export type Measurements = Partial<Record<MetricId, Record<string, Measurement | null | undefined>>>;

/** Upper limits applied by guardrails, for example the ground contact cap. */
export type Caps = Partial<Record<MetricId, number>>;

export interface ComponentScore {
  id: string;
  label: string;
  value: number | null;
  score: number | null;
  confidence: Confidence | null;
}

export interface MetricScore {
  id: MetricId;
  label: string;
  /** null when less than MIN_MEASURED_WEIGHT of the metric was measured. */
  score: number | null;
  confidence: Confidence | null;
  capped: boolean;
  components: ComponentScore[];
}

export interface Scorecard {
  overall: number | null;
  /** True when at least one metric couldn't be scored. */
  partial: boolean;
  metrics: MetricScore[];
}

const CONFIDENCE_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

export const round1 = (x: number) => Math.round(x * 10) / 10;

/** Piecewise-linear interpolation through the anchors, clamped at both ends. */
export function interpolate(anchors: readonly Anchor[], x: number): number {
  if (anchors.length === 0) throw new Error('No anchors');
  if (x <= anchors[0][0]) return anchors[0][1];
  const last = anchors[anchors.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i];
    if (x <= x1) {
      const [x0, y0] = anchors[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return last[1];
}

export function scoreComponent(def: ComponentDef, value: number, profile: Profile): number {
  const s = def.scale;
  if (s.kind === 'direct') return Math.min(10, Math.max(0, value));
  if (s.kind === 'anchors') return interpolate(s.anchors, value);
  const factor = LEVELS[profile.level].factor;
  const scaled = s.anchors[profile.norms].map(([v, score]) => [v * factor, score] as const);
  return interpolate(scaled, value);
}

function lowest(a: Confidence | null, b: Confidence): Confidence {
  return a == null || CONFIDENCE_RANK[b] < CONFIDENCE_RANK[a] ? b : a;
}

export function scoreAll(measurements: Measurements, profile: Profile, caps: Caps = {}): Scorecard {
  const metrics: MetricScore[] = METRICS.map((m) => {
    const measured = measurements[m.id] ?? {};
    let weightSum = 0;
    let weighted = 0;
    let confidence: Confidence | null = null;
    const components: ComponentScore[] = m.components.map((c) => {
      const meas = measured[c.id];
      if (meas == null || !Number.isFinite(meas.value)) {
        return { id: c.id, label: c.label, value: null, score: null, confidence: null };
      }
      const score = scoreComponent(c, meas.value, profile);
      weightSum += c.weight;
      weighted += c.weight * score;
      confidence = lowest(confidence, meas.confidence);
      return { id: c.id, label: c.label, value: meas.value, score: round1(score), confidence: meas.confidence };
    });

    const totalWeight = m.components.reduce((t, c) => t + c.weight, 0);
    if (weightSum / totalWeight < MIN_MEASURED_WEIGHT) {
      return { id: m.id, label: m.label, score: null, confidence: null, capped: false, components };
    }
    let raw = weighted / weightSum;
    const cap = caps[m.id];
    const capped = cap != null && raw > cap;
    if (capped) raw = cap;
    return { id: m.id, label: m.label, score: raw, confidence, capped, components };
  });

  const scored = metrics.filter((m) => m.score != null);
  const partial = scored.length < metrics.length;
  let overall: number | null = null;
  if (scored.length > 0) {
    const w = scored.reduce((t, m) => t + METRICS.find((d) => d.id === m.id)!.weight, 0);
    overall = scored.reduce((t, m) => t + METRICS.find((d) => d.id === m.id)!.weight * m.score!, 0) / w;
  }

  // Round once, after every combination step.
  return {
    overall: overall == null ? null : round1(overall),
    partial,
    metrics: metrics.map((m) => ({ ...m, score: m.score == null ? null : round1(m.score) })),
  };
}
