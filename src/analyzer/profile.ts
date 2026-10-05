// Athlete profile: the inputs the analyzer needs besides the video.

export type Norms = 'men' | 'women';
export type Level = 'youth' | 'highSchool' | 'adultRec' | 'college' | 'elite';
export type Hand = 'right' | 'left' | 'unknown';
export type NetId = 'men' | 'women' | 'coed';

export interface Profile {
  heightM: number;
  /** null when the athlete said "I don't know"; use standingReach() to read it. */
  standingReachM: number | null;
  norms: Norms;
  level: Level;
  hand: Hand;
  net: NetId;
}

export const NET_HEIGHTS: Record<NetId, { label: string; heightM: number; imperial: string }> = {
  men: { label: "Men's", heightM: 2.43, imperial: `7'11⅝"` },
  women: { label: "Women's", heightM: 2.24, imperial: `7'4⅛"` },
  // USA Volleyball coed play uses the men's height.
  coed: { label: 'Coed', heightM: 2.43, imperial: `7'11⅝"` },
};

export const LEVELS: Record<Level, { label: string; factor: number }> = {
  youth: { label: 'Youth (14U)', factor: 0.6 },
  highSchool: { label: 'High school', factor: 0.75 },
  adultRec: { label: 'Adult rec', factor: 0.75 },
  college: { label: 'College', factor: 0.9 },
  elite: { label: 'Elite / pro', factor: 1.0 },
};

/** Standing reach as a multiple of height, used when the athlete doesn't know theirs. */
export const REACH_TO_HEIGHT = 1.33;

export function standingReach(p: Profile): { meters: number; estimated: boolean } {
  if (p.standingReachM != null) return { meters: p.standingReachM, estimated: false };
  return { meters: p.heightM * REACH_TO_HEIGHT, estimated: true };
}

export const feetInchesToMeters = (ft: number, inches: number) => (ft * 12 + inches) * 0.0254;
