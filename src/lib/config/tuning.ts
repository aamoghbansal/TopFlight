export type Difficulty = "easy" | "normal" | "hard";
export type RatingVisibility = "visible" | "blind";
export type RatingModel = "career_season" | "prime";
export type Era = "all_time" | "1990s" | "2000s" | "2010s" | "modern";
export type SeasonReveal = "live" | "instant";
export type DraftMode = "classic" | "squad_first" | "position_first";

export const REROLL_ALLOWANCE: Record<Difficulty, { club: number; era: number; full: number }> = {
  easy: { club: 3, era: 2, full: 1 },
  normal: { club: 1, era: 1, full: 0 },
  hard: { club: 0, era: 0, full: 0 },
};

// >1 = more forgiving simulation (better luck for the user), <1 = harsher
export const DIFFICULTY_SIMULATION_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1.15,
  normal: 1.0,
  hard: 0.88,
};

export const TUNING = {
  chemistryWeight: 0.12,
  positionFitPenalty: 0.2,
  homeAdvantage: 0.06,
  ratingInfluence: 0.7,
  randomnessRange: 0.35,
  goalExpectationScale: 1.0,
};

export const ERA_YEAR_RANGES: Record<Era, [number, number] | null> = {
  all_time: null,
  "1990s": [1990, 1999],
  "2000s": [2000, 2009],
  "2010s": [2010, 2019],
  modern: [2020, 2029],
};

// "Prime" reinterprets a player's OVR as their career-peak level rather
// than this specific season's form — a bonus scaled by how far this
// season likely was from their ceiling, approximated via performance tier
// since the demo dataset doesn't carry every season per player.
export const PRIME_BONUS_BY_TIER: Record<string, number> = {
  S: 3,
  A: 4,
  B: 5,
  C: 6,
  D: 7,
};

export function applyRatingModel(overall: number, tier: string, ratingModel: RatingModel): number {
  if (ratingModel !== "prime") return overall;
  const bonus = PRIME_BONUS_BY_TIER[tier] ?? 4;
  return Math.min(99, overall + bonus);
}
