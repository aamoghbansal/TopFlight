import { TUNING, DIFFICULTY_SIMULATION_MULTIPLIER, type Difficulty } from "@/lib/config/tuning";

export interface SimTeamStrength {
  overall: number;
  attack: number;
  midfield: number;
  defence: number;
  goalkeeping: number;
  chemistry: number;
  positionalFit: number; // 0-100
  balance: number; // 0-100
}

export interface SimOpponent {
  overall: number;
  attack: number;
  midfield: number;
  defence: number;
  goalkeeper: number;
}

export interface MatchResult {
  userGoals: number;
  opponentGoals: number;
  possession: number;
  shots: number;
  shotsOnTarget: number;
  matchRating: number;
}

function seededRandom(seed: number): () => number {
  // Mulberry32 PRNG for deterministic daily-challenge simulation when a seed is supplied.
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Poisson-ish goal generator: draws a whole number of goals around an
 * expected-goals value using a simple discretized distribution rather than
 * "rating > rating = win". See section 17/18 simulation philosophy.
 */
function drawGoals(expected: number, rng: () => number): number {
  const L = Math.exp(-Math.max(0.05, expected));
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

export function simulateMatch(
  userTeam: SimTeamStrength,
  opponent: SimOpponent,
  isHome: boolean,
  difficulty: Difficulty,
  rngSeed?: number
): MatchResult {
  const rng = rngSeed !== undefined ? seededRandom(rngSeed) : Math.random;
  const diffMult = DIFFICULTY_SIMULATION_MULTIPLIER[difficulty];

  const fitMultiplier = 0.85 + (userTeam.positionalFit / 100) * 0.3;
  const chemMultiplier = 0.9 + (userTeam.chemistry / 100) * 0.2;
  const balanceMultiplier = 0.92 + (userTeam.balance / 100) * 0.16;
  const homeBonus = isHome ? 1 + TUNING.homeAdvantage : 1 - TUNING.homeAdvantage * 0.5;

  const userAttackPower =
    userTeam.attack * 0.6 +
    userTeam.midfield * 0.4 * fitMultiplier * chemMultiplier * balanceMultiplier * homeBonus * diffMult;
  const oppDefencePower = opponent.defence * 0.7 + opponent.goalkeeper * 0.3;

  const oppAttackPower = opponent.attack * 0.6 + opponent.midfield * 0.4 * (isHome ? 0.96 : 1.04);
  const userDefencePower =
    (userTeam.defence * 0.7 + userTeam.goalkeeping * 0.3) * fitMultiplier * chemMultiplier * diffMult;

  const strengthRatio = (a: number, b: number) => Math.pow(a / Math.max(b, 1), TUNING.ratingInfluence);

  const userExpectedGoals = Math.max(
    0.15,
    1.35 * strengthRatio(userAttackPower, oppDefencePower) * TUNING.goalExpectationScale
  );
  const oppExpectedGoals = Math.max(
    0.1,
    1.1 * strengthRatio(oppAttackPower, userDefencePower) * TUNING.goalExpectationScale
  );

  const jitter = () => 1 + (rng() * 2 - 1) * TUNING.randomnessRange;

  const userGoals = drawGoals(userExpectedGoals * jitter(), rng);
  const opponentGoals = drawGoals(oppExpectedGoals * jitter(), rng);

  const totalShotsBase = 10 + userExpectedGoals * 3;
  const shots = Math.round(totalShotsBase + rng() * 6);
  const shotsOnTarget = Math.min(shots, Math.round(shots * (0.35 + rng() * 0.2)));
  const possession = Math.round(Math.min(75, Math.max(30, 50 + (userAttackPower - oppAttackPower) * 0.4)));

  let matchRating = 6.0 + (userGoals - opponentGoals) * 0.4 + (userTeam.overall - 75) * 0.03;
  matchRating = Math.max(4.0, Math.min(10.0, Math.round(matchRating * 10) / 10));

  return { userGoals, opponentGoals, possession, shots, shotsOnTarget, matchRating };
}

export interface StrengthTierConfig {
  tier: "title_contender" | "european" | "mid_table" | "relegation_battler";
  overallRange: [number, number];
  weight: number;
}

// Section 19: synthetic opponent engine tiers, generated from configurable
// weighted bands. This is "option B" from the spec (user-team simulation
// against a configured opponent schedule) — the more reliable MVP
// architecture per section 19's own guidance. A fully independent
// league-wide simulation (option A) is the natural next extension.
export const STRENGTH_TIERS: StrengthTierConfig[] = [
  { tier: "title_contender", overallRange: [83, 90], weight: 0.15 },
  { tier: "european", overallRange: [78, 83], weight: 0.2 },
  { tier: "mid_table", overallRange: [70, 78], weight: 0.4 },
  { tier: "relegation_battler", overallRange: [60, 70], weight: 0.25 },
];

export function generateOpponentPool(numClubs: number, rng: () => number = Math.random): SimOpponent[] {
  const pool: SimOpponent[] = [];
  for (const tierCfg of STRENGTH_TIERS) {
    const count = Math.round(numClubs * tierCfg.weight);
    for (let i = 0; i < count; i++) {
      const [lo, hi] = tierCfg.overallRange;
      const base = lo + rng() * (hi - lo);
      pool.push({
        overall: Math.round(base),
        attack: Math.round(base + (rng() * 6 - 3)),
        midfield: Math.round(base + (rng() * 6 - 3)),
        defence: Math.round(base + (rng() * 6 - 3)),
        goalkeeper: Math.round(base + (rng() * 6 - 3)),
      });
    }
  }
  while (pool.length < numClubs - 1) pool.push(pool[pool.length % Math.max(pool.length, 1)]);
  return pool.slice(0, numClubs - 1);
}
