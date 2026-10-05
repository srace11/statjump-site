// Scoring rubric as data. The prose version is docs/rubric-v0.1.md.
// Any change to a number here must bump RUBRIC_VERSION, because stored
// results are only comparable when they share a rubric version.

import type { Norms } from './profile';

export const RUBRIC_VERSION = '0.1.0';

/** [measured value, score 0–10]. Must be sorted by value. */
export type Anchor = readonly [value: number, score: number];

export type ComponentScale =
  /** Measured value mapped through anchors that are the same for everyone. */
  | { kind: 'anchors'; anchors: readonly Anchor[] }
  /** Anchors depend on norms, and their values are multiplied by the level factor. */
  | { kind: 'normed'; anchors: Record<Norms, readonly Anchor[]> }
  /** The extractor already produced a 0–10 score (pattern checks, deductions). */
  | { kind: 'direct' };

export interface ComponentDef {
  id: string;
  label: string;
  unit: string;
  weight: number;
  scale: ComponentScale;
}

export interface MetricDef {
  id: MetricId;
  label: string;
  /** Weight in the overall score. */
  weight: number;
  components: readonly ComponentDef[];
}

export type MetricId =
  | 'vertical'
  | 'touchHeight'
  | 'groundContact'
  | 'armSwing'
  | 'kneeLoad'
  | 'penultimate'
  | 'approach';

/** A metric with less than this share of its weight measured is not scored. */
export const MIN_MEASURED_WEIGHT = 0.5;

export const METRICS: readonly MetricDef[] = [
  {
    id: 'vertical',
    label: 'Estimated vertical',
    weight: 0.15,
    components: [
      {
        id: 'jumpHeight', label: 'Jump height', unit: 'm', weight: 1,
        scale: { kind: 'normed', anchors: {
          men: [[0.30, 2], [0.45, 4], [0.60, 6], [0.75, 8], [0.90, 10]],
          women: [[0.22, 2], [0.33, 4], [0.44, 6], [0.55, 8], [0.66, 10]],
        } },
      },
    ],
  },
  {
    id: 'touchHeight',
    label: 'Touch height',
    weight: 0.15,
    components: [
      {
        id: 'aboveNet', label: 'Touch above the net', unit: 'm', weight: 1,
        scale: { kind: 'normed', anchors: {
          men: [[0, 1], [0.20, 3], [0.40, 5], [0.60, 7], [0.80, 9], [1.00, 10]],
          women: [[0, 1], [0.15, 3], [0.30, 5], [0.45, 7], [0.60, 9], [0.75, 10]],
        } },
      },
    ],
  },
  {
    id: 'groundContact',
    label: 'Ground contact time',
    weight: 0.10,
    components: [
      {
        id: 'plantContact', label: 'Plant contact time', unit: 's', weight: 0.6,
        scale: { kind: 'anchors', anchors: [[0.25, 10], [0.33, 6], [0.45, 2]] },
      },
      {
        id: 'footStagger', label: 'Foot stagger', unit: 's', weight: 0.2,
        scale: { kind: 'anchors', anchors: [[0, 6], [0.03, 10], [0.12, 10], [0.20, 6], [0.30, 2]] },
      },
      {
        id: 'efficiency', label: 'Jump efficiency', unit: 'm/s', weight: 0.2,
        scale: { kind: 'normed', anchors: {
          men: [[0.8, 2], [1.6, 6], [2.6, 10]],
          women: [[0.6, 2], [1.2, 6], [2.0, 10]],
        } },
      },
    ],
  },
  {
    id: 'armSwing',
    label: 'Arm swing',
    weight: 0.15,
    components: [
      {
        id: 'backswingRange', label: 'Backswing range', unit: 'deg', weight: 0.25,
        scale: { kind: 'anchors', anchors: [[0, 2], [30, 6], [60, 10]] },
      },
      {
        id: 'backswingTiming', label: 'Backswing timing', unit: 's', weight: 0.25,
        scale: { kind: 'anchors', anchors: [[0.05, 10], [0.15, 6], [0.30, 2]] },
      },
      {
        id: 'forwardSwing', label: 'Forward swing', unit: 'arm lengths', weight: 0.25,
        scale: { kind: 'anchors', anchors: [[-0.5, 2], [0, 6], [0.5, 10]] },
      },
      { id: 'bowAndArrow', label: 'Bow-and-arrow', unit: 'score', weight: 0.25, scale: { kind: 'direct' } },
    ],
  },
  {
    id: 'kneeLoad',
    label: 'Knee bend and load',
    weight: 0.15,
    components: [
      {
        id: 'kneeAngle', label: 'Deepest knee angle', unit: 'deg', weight: 0.45,
        scale: { kind: 'anchors', anchors: [[70, 2], [85, 6], [100, 10], [120, 10], [135, 6], [150, 2]] },
      },
      {
        id: 'trunkLean', label: 'Trunk lean', unit: 'deg', weight: 0.2,
        scale: { kind: 'anchors', anchors: [[5, 2], [15, 6], [30, 10], [45, 10], [60, 6], [70, 2]] },
      },
      {
        id: 'loweringTime', label: 'Lowering time', unit: 's', weight: 0.2,
        scale: { kind: 'anchors', anchors: [[0.12, 10], [0.18, 6], [0.25, 2]] },
      },
      {
        id: 'hipDrop', label: 'Hip drop', unit: 'fraction', weight: 0.15,
        scale: { kind: 'anchors', anchors: [[0.03, 2], [0.06, 6], [0.10, 10], [0.18, 10], [0.25, 6], [0.30, 2]] },
      },
    ],
  },
  {
    id: 'penultimate',
    label: 'Penultimate step',
    weight: 0.15,
    components: [
      {
        id: 'lengthRatio', label: 'Length vs. previous step', unit: 'ratio', weight: 0.3,
        scale: { kind: 'anchors', anchors: [[0.8, 2], [1.0, 6], [1.15, 10]] },
      },
      {
        id: 'lengthToHeight', label: 'Length vs. height', unit: 'ratio', weight: 0.2,
        scale: { kind: 'anchors', anchors: [[0.45, 2], [0.65, 6], [0.85, 10]] },
      },
      {
        id: 'hipLowering', label: 'Hips lowering', unit: 'fraction', weight: 0.2,
        scale: { kind: 'anchors', anchors: [[0, 2], [0.02, 6], [0.05, 10], [0.10, 10], [0.15, 6]] },
      },
      { id: 'heelFirst', label: 'Heel-first plant', unit: 'score', weight: 0.15, scale: { kind: 'direct' } },
      {
        id: 'transitionTime', label: 'Penultimate → plant time', unit: 's', weight: 0.15,
        scale: { kind: 'anchors', anchors: [[0.20, 10], [0.28, 6], [0.40, 2]] },
      },
    ],
  },
  {
    id: 'approach',
    label: 'Approach',
    weight: 0.15,
    components: [
      { id: 'footwork', label: 'Footwork pattern', unit: 'score', weight: 0.25, scale: { kind: 'direct' } },
      { id: 'inefficiencies', label: 'Inefficiency flags', unit: 'score', weight: 0.25, scale: { kind: 'direct' } },
      {
        id: 'speedBuildUp', label: 'Speed build-up', unit: 'fraction', weight: 0.2,
        scale: { kind: 'anchors', anchors: [[0, 2], [0.5, 6], [1, 10]] },
      },
      {
        id: 'plantSpeed', label: 'Speed into the plant', unit: 'm/s', weight: 0.15,
        scale: { kind: 'normed', anchors: {
          men: [[1.5, 2], [2.5, 6], [3.5, 10]],
          women: [[1.5, 2], [2.25, 6], [3.0, 10]],
        } },
      },
      {
        id: 'forwardDrift', label: 'Forward drift in the air', unit: 'm', weight: 0.15,
        scale: { kind: 'anchors', anchors: [[0.5, 10], [0.85, 6], [1.2, 2]] },
      },
    ],
  },
];

/** Deductions for the approach "inefficiency flags" component. */
export const APPROACH_DEDUCTIONS = {
  bunnyHop: 5,
  stutterStep: 3,
  standingStart: 3,
  crossover: 2,
} as const;
