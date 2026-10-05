# Stat Jump scoring rubric, v0.1 (draft)

Scope: the **spike approach** only, filmed from the side by a phone and analyzed entirely on the device.

The code version of this rubric is [`src/analyzer/rubric.ts`](../src/analyzer/rubric.ts). If the two disagree, the code wins and this file is out of date.

The thresholds below are starting values taken from typical ranges in published volleyball jump research. They have not been checked against specific papers yet. Tune them against our own clips with known ground truth before anyone relies on the scores.

---

## 1. Recording guidance

| | Landscape | Portrait (for social posts) |
|---|---|---|
| Lens | 0.5x at 10–15 ft, or 1x at about 20 ft | 0.5x at 10–15 ft |
| Height | Head height, phone level | Head height, phone level |
| Frame rate | 60fps | 60fps |
| Must be visible | The whole approach and the full jump, with headroom above the reach | The last two steps, the plant and the full jump, with headroom |

- The phone sits beside the approach path and points at it at a right angle. It doesn't follow the athlete (no panning or zooming).
- Handheld is allowed. Small shake is removed by software stabilization, planned for v0.2.
- One approach and jump per video.
- 30fps is accepted, but confidence is lower and ground contact time is not scored (see §4).
- In portrait, earlier approach steps may be out of frame. Approach parts that need every step (step count, speed build-up) then show as "not measured", not as a low score.
- Slo-mo is out of scope for now. Retimed slo-mo exports from iOS stretch every timing, so they need their own handling before we accept them.

## 2. Profile inputs

| Input | Required | Notes |
|---|---|---|
| Height | Yes | The main ruler for converting pixels to distance (§3) |
| Standing reach | No | If "I don't know", estimated as **1.33 × height** and marked as estimated, so touch height gets a wider uncertainty |
| Scoring norms | Yes | Men's or women's. Kept separate from net height so coed players choose their own. |
| Competitive level | Yes | Youth (14U), High school, College, Adult rec, Elite/pro. Scales outcome norms only (§5). |
| Hitting hand | Yes (can be "Not sure") | Checked against the video (§6) |
| Net height | Yes, remembered | Men's 2.43m (7'11⅝"), Women's 2.24m (7'4⅛"), Coed 2.43m (same as men's) |

## 3. Scale and the net

- **The athlete's own height is the ruler.** It's measured in pixels on standing frames, at the same distance from the camera as the jump. That avoids the depth error a net-based scale would have.
- **Net height is the target, not the ruler.** Touch height above the net is touch height minus net height, so the user never has to tap the net.
- The net may be tapped later as an optional cross-check.

## 4. Scoring method

1. Each metric is built from **components**. Each component turns one measurement into a 0–10 score using fixed **anchor points**, with straight-line interpolation between anchors and clamping beyond the ends.
2. Some components are scored directly as 0–10 (pattern checks and deductions).
3. A metric's score is the weighted mean of its components. Components that couldn't be measured are skipped and the remaining weights are rescaled. If less than half of a metric's weight was measured, the metric is **not scored**.
4. Each metric carries a **confidence** (high, medium or low): the lowest confidence of the components it used.
5. Rounding to 0.1 happens only once, at the end.
6. **Overall score** is the weighted mean of the scored metrics. If any metric wasn't scored, the overall is marked **partial**.

| Metric | Weight in overall |
|---|---|
| Estimated vertical | 15% |
| Touch height | 15% |
| Ground contact time | 10% |
| Arm swing | 15% |
| Knee bend and load | 15% |
| Penultimate step | 15% |
| Approach | 15% |

Technique makes up 70% of the overall score because the app is a practice tool. Outcome (vertical and touch) makes up 30%.

### Frame rate rules

| Frame rate | Effect |
|---|---|
| ≥ 50fps | Normal |
| 25–49fps | All timing components are medium confidence at best. Ground contact time is **not scored**. |
| < 25fps | Not analyzed |

## 5. Competitive level scaling

Only **outcome** anchors are scaled: vertical, touch above the net, jump efficiency and approach speed. Each of their anchor values is multiplied by the factor for the athlete's level. Technique is technique, so knee angle, arm timing and step ratios are never scaled.

| Level | Factor |
|---|---|
| Youth (14U) | 0.60 |
| High school | 0.75 |
| Adult rec | 0.75 |
| College | 0.90 |
| Elite / pro | 1.00 |

The tables below are written at the **elite (1.00)** level.

## 6. Hitting hand check

The user's answer is checked two ways:

1. **Arm:** the wrist that goes highest and moves fastest around the top of the jump.
2. **Footwork:** the last two contacts. A right-hander ends right then left; a left-hander ends left then right.

If both checks agree with each other but not with the user's answer, we score with the detected hand and say so. If the checks disagree with each other, we use the user's answer and lower confidence on arm swing and footwork.

---

## 7. Metrics

### 7.1 Estimated vertical

Measured by flight time (h = g·t²/8), cross-checked against how far the hips rise. If the two disagree by more than 5cm, confidence drops to medium. At 60fps, one frame of timing error is about ±3cm at typical flight times.

| Score | Men's norms | Women's norms |
|---|---|---|
| 2 | 30cm | 22cm |
| 4 | 45cm | 33cm |
| 6 | 60cm | 44cm |
| 8 | 75cm | 55cm |
| 10 | 90cm | 66cm |

### 7.2 Touch height (above the net)

Touch height = standing reach + vertical, cross-checked against the highest wrist point plus a wrist-to-fingertip offset taken from standing reach.

| Score | Men's norms | Women's norms |
|---|---|---|
| 1 | 0cm | 0cm |
| 3 | 20cm | 15cm |
| 5 | 40cm | 30cm |
| 7 | 60cm | 45cm |
| 9 | 80cm | 60cm |
| 10 | 100cm | 75cm |

### 7.3 Ground contact time (final plant)

Measured from the first plant foot touching down to the last toe leaving the ground.

| Component | Weight | Anchors (value → score) |
|---|---|---|
| Plant contact time | 60% | 0.25s → 10, 0.33s → 6, 0.45s → 2 |
| Foot stagger (gap between the two plant feet landing) | 20% | 0s → 6, 0.03–0.12s → 10, 0.20s → 6, 0.30s → 2 |
| Jump efficiency (vertical m ÷ contact s), level-scaled | 20% | Men: 0.8 → 2, 1.6 → 6, 2.6 → 10. Women: 0.6 → 2, 1.2 → 6, 2.0 → 10. |

**Guardrail:** if the deepest knee angle is over 140° *and* the vertical scored under 5, this metric is capped at 6. A short contact from a shallow, weak plant isn't efficient.

### 7.4 Arm swing

| Component | Weight | Anchors (value → score) |
|---|---|---|
| Backswing range (how far the arms go behind the trunk line) | 25% | 0° → 2, 30° → 6, 60° → 10 |
| Backswing timing (furthest-back point vs. plant touchdown, absolute gap) | 25% | 0.05s → 10, 0.15s → 6, 0.30s → 2 |
| Forward swing (wrist height above shoulder at toe-off, as a fraction of arm length) | 25% | −0.5 → 2, 0 → 6, 0.5 → 10 |
| Bow-and-arrow at peak (direct 0–10) | 25% | Hitting elbow at or above shoulder height and drawn back: up to 6 points. Non-hitting arm ≥45° above horizontal: up to 4 points. |

Only the near arm is measured reliably. If the hitting arm is the far arm, confidence is medium at best.

### 7.5 Knee bend and load

| Component | Weight | Anchors (value → score) |
|---|---|---|
| Deepest knee angle in the plant | 45% | 70° → 2, 85° → 6, 100–120° → 10, 135° → 6, 150° → 2 |
| Forward trunk lean at the bottom | 20% | 5° → 2, 15° → 6, 30–45° → 10, 60° → 6, 70° → 2 |
| Lowering time (touchdown to deepest point) | 20% | 0.12s → 10, 0.18s → 6, 0.25s → 2 |
| Hip drop (fraction of standing hip height) | 15% | 3% → 2, 6% → 6, 10–18% → 10, 25% → 6, 30% → 2 |

This measures how the athlete loads (depth, timing, posture), not force. Force needs force plates.

### 7.6 Penultimate step

| Component | Weight | Anchors (value → score) |
|---|---|---|
| Length ratio (penultimate step ÷ previous step) | 30% | 0.8 → 2, 1.0 → 6, 1.15 → 10 |
| Penultimate length ÷ athlete height | 20% | 0.45 → 2, 0.65 → 6, 0.85 → 10 |
| Hips lowering during the step (fraction of standing hip height) | 20% | 0% → 2, 2% → 6, 5–10% → 10, 15% → 6 |
| Plant foot lands heel-first (direct 0–10) | 15% | Heel-first 10, flat-foot 6, toe-first 2 |
| Penultimate → plant timing | 15% | 0.20s → 10, 0.28s → 6, 0.40s → 2 |

### 7.7 Approach

| Component | Weight | Anchors (value → score) |
|---|---|---|
| Footwork pattern (direct 0–10) | 25% | Correct 3- or 4-step sequence ending right-left (righty) or left-right (lefty): 10. Correct finish but extra or missing steps: 6. Wrong-foot finish: 2. |
| Inefficiency flags (direct, 10 minus deductions, minimum 0) | 25% | Bunny hop −5, stutter step (a step under 50% of the one before) −3, standing start/no momentum −3, crossover step −2 |
| Speed build-up (share of step-to-step transitions where speed rises up to the penultimate step) | 20% | 0 → 2, 0.5 → 6, 1.0 → 10 |
| Speed into the plant, level-scaled | 15% | Men: 1.5 → 2, 2.5 → 6, 3.5 → 10 m/s. Women: 1.5 → 2, 2.25 → 6, 3.0 → 10 m/s. |
| Forward drift in the air | 15% | 0.5m → 10, 0.85m → 6, 1.2m → 2 |

**Bunny hop:** both feet leave the ground and land together before the plant, with no alternating step in between.

The side view can't see sideways drift or the approach angle into the net. Those need a front camera and are out of scope.

---

## 8. Reproducibility contract

- Every result is stamped with the **SHA-256 of the video file**, the **analyzer version**, the **rubric version** and the **pose model and runtime versions**.
- Same file + same versions = same scores. Golden test clips enforce this in CI once we have them.
- The pose model runs on the **CPU** delegate with a pinned model file served from our own site, never a "latest" URL.
- Frames come from WebCodecs decoding with container timestamps. We never seek a `<video>` element for analysis, because seeking skips or repeats frames.
- Known limit: different browsers or devices can differ by tiny amounts in pose output and in JS math functions such as `Math.atan2`. The target is identical scores after rounding to 0.1 on the same platform, and agreement within ±0.2 across platforms. To be verified.

## 9. Open items for tuning

- Replace the starting thresholds with values from cited papers, then calibrate on 20+ clips with ground truth (Vertec, jump mat, or hand-marked frames).
- Youth norms may need separate tables instead of one 0.60 factor.
- Decide whether the overall score shows when it's partial, and how that's labeled.
