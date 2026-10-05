// Checks whether a video is good enough to score, from its frame timestamps
// and detection results. Warnings lower trust; blockers stop the analysis.

export interface FrameRate {
  median: number;
  /** Largest gap between frames, in frames at the median rate (1 = perfectly even). */
  worstGap: number;
}

export interface QualityReport {
  frameRate: FrameRate;
  detectedShare: number;
  warnings: string[];
  blockers: string[];
}

export function frameRate(timesMs: number[]): FrameRate {
  if (timesMs.length < 2) return { median: 0, worstGap: 0 };
  const gaps = timesMs.slice(1).map((t, i) => t - timesMs[i]).sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)];
  return { median: 1000 / median, worstGap: gaps[gaps.length - 1] / median };
}

export function assessQuality(timesMs: number[], detected: number, durationS: number): QualityReport {
  const fr = frameRate(timesMs);
  const detectedShare = timesMs.length ? detected / timesMs.length : 0;
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (fr.median < 25) blockers.push(`Frame rate is ${fr.median.toFixed(0)}fps. Record at 60fps.`);
  else if (fr.median < 50) warnings.push(`Frame rate is ${fr.median.toFixed(0)}fps. Timing is less precise and ground contact time won't be scored. Record at 60fps.`);
  if (fr.worstGap > 1.5) warnings.push(`The video skips frames (largest gap is ${fr.worstGap.toFixed(1)} frames). Timing near the gap may be off.`);

  if (detectedShare < 0.3) blockers.push('The athlete was found in too few frames. Make sure their whole body is in view.');
  else if (detectedShare < 0.8) warnings.push(`The athlete was found in only ${Math.round(detectedShare * 100)}% of frames.`);

  if (durationS > 20) warnings.push('The video is longer than 20 seconds. Trim it to one approach and jump.');

  return { frameRate: fr, detectedShare, warnings, blockers };
}
