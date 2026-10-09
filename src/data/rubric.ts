// Scoring rubric v0.2, copied from statjump-app/docs/rubric-v0.2.json (the doc rubric-v0.2.md wins if they differ).
// Values are in the rubric's own units (m, s, deg, fraction, m/s); the page converts them for display.
// When the app's rubric changes, update this file to match, never the other way round.

export const rubricVersion = '0.2';

export const norms = [
  { id: 'men', label: "Men's" },
  { id: 'women', label: "Women's" },
] as const;

// Level factors scale the level-scaled anchors only (outcome targets). Technique is the same for everyone.
export const levels = [
  { id: 'youth', label: 'Youth (14U)', factor: 0.6 },
  { id: 'highSchool', label: 'High school', factor: 0.75 },
  { id: 'adultRec', label: 'Adult rec', factor: 0.75 },
  { id: 'college', label: 'College', factor: 0.9 },
  { id: 'elite', label: 'Elite / pro', factor: 1 },
] as const;

export type Norms = (typeof norms)[number]['id'];
type Anchors = [number, number][];
type Fmt = 'in' | 's' | 'deg' | 'pct' | 'ratio' | 'armLengths' | 'mph' | 'efficiency';

export type Component = {
  label: string;
  weight: number;
  about: string;
  fmt?: Fmt;
  // Same for everyone, or one set per norms. Omitted for direct (pass/fail style) components.
  anchors?: Anchors | Record<Norms, Anchors>;
  levelScaled?: boolean;
  // Direct components: how the 0-10 is given, in words.
  rule?: string;
};

export type Metric = { label: string; weight: number; about: string; components: Component[]; note?: string };

export const metrics: Metric[] = [
  {
    label: 'Estimated vertical',
    weight: 0.15,
    about: 'Jump height, from your time in the air, checked against how far your hips rise.',
    components: [
      {
        label: 'Jump height',
        weight: 1,
        about: 'Higher is better.',
        fmt: 'in',
        levelScaled: true,
        anchors: {
          men: [[0.3, 2], [0.45, 4], [0.6, 6], [0.75, 8], [0.9, 10]],
          women: [[0.22, 2], [0.33, 4], [0.44, 6], [0.55, 8], [0.66, 10]],
        },
      },
    ],
  },
  {
    label: 'Touch height',
    weight: 0.15,
    about: 'How far above the net you reach: your standing reach plus your vertical.',
    components: [
      {
        label: 'Reach above the net',
        weight: 1,
        about: 'Higher is better.',
        fmt: 'in',
        levelScaled: true,
        anchors: {
          men: [[0, 1], [0.2, 3], [0.4, 5], [0.6, 7], [0.8, 9], [1.0, 10]],
          women: [[0, 1], [0.15, 3], [0.3, 5], [0.45, 7], [0.6, 9], [0.75, 10]],
        },
      },
    ],
  },
  {
    label: 'Ground contact time',
    weight: 0.1,
    about: 'How quickly your final plant turns into the jump.',
    note: 'If your deepest knee angle is over 140° and your vertical scores under 5, this score is capped at 6: a quick plant from a shallow bend is not an efficient one.',
    components: [
      {
        label: 'Plant contact time',
        weight: 0.6,
        about: 'From your first plant foot landing to your last toe leaving the ground. Shorter is better.',
        fmt: 's',
        anchors: [[0.25, 10], [0.33, 6], [0.45, 2]],
      },
      {
        label: 'Foot stagger',
        weight: 0.2,
        about: 'The gap between your two plant feet landing. A small gap is best.',
        fmt: 's',
        anchors: [[0, 6], [0.03, 10], [0.12, 10], [0.2, 6], [0.3, 2]],
      },
      {
        label: 'Jump efficiency',
        weight: 0.2,
        about: 'Your vertical in meters divided by your contact time in seconds. Higher is better.',
        fmt: 'efficiency',
        levelScaled: true,
        anchors: {
          men: [[0.8, 2], [1.6, 6], [2.6, 10]],
          women: [[0.6, 2], [1.2, 6], [2.0, 10]],
        },
      },
    ],
  },
  {
    label: 'Arm swing',
    weight: 0.15,
    about: 'How much your arms add to the jump, and how ready you are to hit at the top.',
    components: [
      {
        label: 'Backswing range',
        weight: 0.25,
        about: 'How far your arms swing back behind your body.',
        fmt: 'deg',
        anchors: [[0, 2], [30, 6], [60, 10]],
      },
      {
        label: 'Backswing timing',
        weight: 0.25,
        about: 'How close your arms reach their furthest-back point to your plant foot landing.',
        fmt: 's',
        anchors: [[0.05, 10], [0.15, 6], [0.3, 2]],
      },
      {
        label: 'Forward swing',
        weight: 0.25,
        about: 'How high your wrists are above your shoulders as you leave the ground.',
        fmt: 'armLengths',
        anchors: [[-0.5, 2], [0, 6], [0.5, 10]],
      },
      {
        label: 'Bow-and-arrow',
        weight: 0.25,
        about: 'Your arm position at the top of the jump.',
        rule: 'Up to 6 points when your hitting elbow is at or above shoulder height and drawn back (3 if only one of the two), plus up to 4 points for raising your other arm 45° or more above horizontal.',
      },
    ],
  },
  {
    label: 'Knee bend and load',
    weight: 0.15,
    about: 'How you load into the plant: depth, timing and posture.',
    components: [
      {
        label: 'Deepest knee angle',
        weight: 0.45,
        about: 'The tightest your knee bends in the plant (180° is a straight leg). Too deep and too shallow both cost points.',
        fmt: 'deg',
        anchors: [[70, 2], [85, 6], [100, 10], [120, 10], [135, 6], [150, 2]],
      },
      {
        label: 'Trunk lean',
        weight: 0.2,
        about: 'How far your chest leans forward at your lowest point.',
        fmt: 'deg',
        anchors: [[5, 2], [15, 6], [30, 10], [45, 10], [60, 6], [70, 2]],
      },
      {
        label: 'Lowering time',
        weight: 0.2,
        about: 'From your plant foot landing to your lowest point. Faster is better.',
        fmt: 's',
        anchors: [[0.12, 10], [0.18, 6], [0.25, 2]],
      },
      {
        label: 'Hip drop',
        weight: 0.15,
        about: 'How far your hips drop, as a share of your standing hip height.',
        fmt: 'pct',
        anchors: [[0.03, 2], [0.06, 6], [0.1, 10], [0.18, 10], [0.25, 6], [0.3, 2]],
      },
    ],
  },
  {
    label: 'Penultimate step',
    weight: 0.15,
    about: 'Your second-to-last step: the long, low step that sets up the plant.',
    components: [
      {
        label: 'Length vs. your previous step',
        weight: 0.3,
        about: 'Penultimate step length divided by the step before it. Longer is better.',
        fmt: 'ratio',
        anchors: [[0.8, 2], [1.0, 6], [1.15, 10]],
      },
      {
        label: 'Length vs. your height',
        weight: 0.2,
        about: 'Penultimate step length divided by your height.',
        fmt: 'ratio',
        anchors: [[0.45, 2], [0.65, 6], [0.85, 10]],
      },
      {
        label: 'Hips lowering',
        weight: 0.2,
        about: 'How far your hips lower during the step, as a share of your standing hip height.',
        fmt: 'pct',
        anchors: [[0, 2], [0.02, 6], [0.05, 10], [0.1, 10], [0.15, 6]],
      },
      {
        label: 'Heel-first plant',
        weight: 0.15,
        about: 'How your plant foot first touches the ground.',
        rule: 'Heel first: 10. Flat foot: 6. Toe first: 2.',
      },
      {
        label: 'Step time',
        weight: 0.15,
        about: 'From your previous foot landing to your penultimate foot landing. Quicker is better.',
        fmt: 's',
        anchors: [[0.2, 10], [0.28, 6], [0.4, 2]],
      },
    ],
  },
  {
    label: 'Approach',
    weight: 0.15,
    about: 'Your footwork and speed on the way in.',
    components: [
      {
        label: 'Footwork pattern',
        weight: 0.25,
        about: 'Your step count and which foot you finish on.',
        rule: 'A 3- or 4-step approach that finishes right-left (right-handed) or left-right (left-handed): 10. The right finish with extra or missing steps: 6. A wrong-foot finish: 2.',
      },
      {
        label: 'Inefficiency flags',
        weight: 0.25,
        about: 'Habits that bleed speed.',
        rule: 'Starts at 10. Minus 5 for a bunny hop, 3 for a stutter step, 3 for a standing start and 2 for a crossover step.',
      },
      {
        label: 'Speed build-up',
        weight: 0.2,
        about: 'The share of your steps that get faster on the way to the penultimate step.',
        fmt: 'pct',
        anchors: [[0, 2], [0.5, 6], [1, 10]],
      },
      {
        label: 'Speed into the plant',
        weight: 0.15,
        about: 'How fast you are moving as you plant. Faster is better.',
        fmt: 'mph',
        levelScaled: true,
        anchors: {
          men: [[1.5, 2], [2.5, 6], [3.5, 10]],
          women: [[1.5, 2], [2.25, 6], [3.0, 10]],
        },
      },
      {
        label: 'Forward drift',
        weight: 0.15,
        about: 'How far you float forward in the air. Less is better.',
        fmt: 'in',
        anchors: [[0.5, 10], [0.85, 6], [1.2, 2]],
      },
    ],
  },
];

const trim = (n: number, places: number) => String(Number(n.toFixed(places)));

export function formatValue(v: number, fmt: Fmt): string {
  switch (fmt) {
    case 'in': return `${trim(v / 0.0254, 1)} in`;
    case 's': return `${trim(v, 2)} s`;
    case 'deg': return `${trim(v, 0)}°`;
    case 'pct': return `${trim(v * 100, 0)}%`;
    case 'ratio': return `${trim(v, 2)}×`;
    case 'armLengths': return v === 0 ? 'level' : `${v > 0 ? '+' : '−'}${trim(Math.abs(v), 2)} arm lengths`;
    case 'mph': return `${trim(v * 2.23694, 1)} mph`;
    case 'efficiency': return trim(v, 2);
  }
}

// [score, value text] per target. Neighbouring anchors with the same score become one range ("100°–120°").
export function targets(c: Component, n: Norms, factor: number): [number, string][] {
  if (!c.anchors || !c.fmt) return [];
  const raw = Array.isArray(c.anchors) ? c.anchors : c.anchors[n];
  const f = c.levelScaled ? factor : 1;
  const out: [number, string][] = [];
  for (let i = 0; i < raw.length; i++) {
    const [v, s] = raw[i];
    const next = raw[i + 1];
    if (next && next[1] === s) {
      out.push([s, `${formatValue(v * f, c.fmt)}–${formatValue(next[0] * f, c.fmt)}`]);
      i++;
    } else {
      out.push([s, formatValue(v * f, c.fmt)]);
    }
  }
  return out;
}
