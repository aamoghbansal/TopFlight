import { TUNING } from "@/lib/config/tuning";
import type { FormationConfig } from "@/lib/config/formations";

export interface RatedPlayer {
  formationSlotId: number;
  slotOrder: number;
  primaryRole: string;
  overall: number;
  positionalFitScore: number; // 1.0 = perfect fit, lower = out of position
  nationality: string;
  performanceTier: string;
}

export interface TeamRatingBreakdown {
  overall: number;
  attack: number;
  midfield: number;
  defence: number;
  goalkeeping: number;
  physical: number;
  chemistry: number;
  positionalFit: number;
  balance: number;
  tacticalFit: number;
  tacticalIdentity: string;
  explanation: { label: string; value: number }[];
  chemistryExplanation: { label: string; delta: number }[];
}

const ATTACK_ROLES = new Set(["LW", "RW", "ST", "CF", "CAM"]);
const MID_ROLES = new Set(["CDM", "CM", "CAM", "LM", "RM"]);
const DEF_ROLES = new Set(["LB", "CB", "RB"]);

/**
 * Positional fit: 1.0 if playing primary role, 0.85 if an eligible
 * secondary role, otherwise penalized by TUNING.positionFitPenalty per
 * "distance" from the required role.
 */
export function computePositionalFit(
  playerPrimary: string,
  playerSecondaries: string[],
  requiredRole: string
): number {
  if (playerPrimary === requiredRole) return 1.0;
  if (playerSecondaries.includes(requiredRole)) return 0.85;
  return Math.max(0.4, 1.0 - TUNING.positionFitPenalty * 2);
}

export function computeChemistry(
  players: { nationality: string; primaryPosition: string; performanceTier: string }[]
): { score: number; breakdown: { label: string; delta: number }[] } {
  const breakdown: { label: string; delta: number }[] = [];
  let score = 70; // baseline

  // Nationality links: +1 per repeated nationality pair, capped
  const natCounts: Record<string, number> = {};
  for (const p of players) natCounts[p.nationality] = (natCounts[p.nationality] || 0) + 1;
  let natBonus = 0;
  for (const count of Object.values(natCounts)) {
    if (count > 1) natBonus += Math.min(count - 1, 3) * 2;
  }
  if (natBonus > 0) {
    breakdown.push({ label: "Nationality links", delta: natBonus });
    score += natBonus;
  }

  // Tier balance: too many "carry" S-tier players with no floor hurts cohesion slightly;
  // a good spread of A/S tier players helps.
  const sCount = players.filter((p) => p.performanceTier === "S").length;
  const tierBonus = Math.min(sCount * 1.5, 15);
  breakdown.push({ label: "Squad quality depth", delta: tierBonus });
  score += tierBonus;

  score = Math.max(40, Math.min(99, score));
  return { score, breakdown };
}

export function computeTeamRating(
  formation: FormationConfig,
  rated: RatedPlayer[]
): TeamRatingBreakdown {
  const weightedFit = rated.reduce((sum, p) => sum + p.positionalFitScore, 0) / rated.length;

  const attackers = rated.filter((p) => ATTACK_ROLES.has(p.primaryRole));
  const midfielders = rated.filter((p) => MID_ROLES.has(p.primaryRole));
  const defenders = rated.filter((p) => DEF_ROLES.has(p.primaryRole));
  const gk = rated.find((p) => p.primaryRole === "GK");

  const avg = (arr: RatedPlayer[]) =>
    arr.length ? arr.reduce((s, p) => s + p.overall * p.positionalFitScore, 0) / arr.length : 60;

  const attack = avg(attackers);
  const midfield = avg(midfielders);
  const defence = avg(defenders);
  const goalkeeping = gk ? gk.overall * gk.positionalFitScore : 60;
  const physical = rated.reduce((s, p) => s + p.overall, 0) / rated.length;

  const { score: chemistry, breakdown: chemistryExplanation } = computeChemistry(
    rated.map((p) => ({ nationality: p.nationality, primaryPosition: p.primaryRole, performanceTier: p.performanceTier }))
  );

  const rawOverall = attack * 0.28 + midfield * 0.27 + defence * 0.27 + goalkeeping * 0.18;
  const chemistryAdjustment = (chemistry - 70) * TUNING.chemistryWeight;
  const overall = Math.max(40, Math.min(99, rawOverall + chemistryAdjustment));

  const balance =
    100 -
    (Math.max(attack, midfield, defence) - Math.min(attack, midfield, defence)) * 1.5;

  // Tactical identity inferred from where the team's strength concentrates
  let tacticalIdentity = "Balanced";
  if (attack - defence > 6) tacticalIdentity = "Direct";
  else if (defence - attack > 6) tacticalIdentity = "Counter Attack";
  else if (midfield - Math.max(attack, defence) > 4) tacticalIdentity = "Possession";
  else if (weightedFit > 0.95 && overall > 85) tacticalIdentity = "High Press";

  const tacticalFit = weightedFit * 100;

  const explanation = [
    { label: "Attack", value: Math.round(attack) },
    { label: "Midfield", value: Math.round(midfield) },
    { label: "Defence", value: Math.round(defence) },
    { label: "Goalkeeping", value: Math.round(goalkeeping) },
    { label: "Chemistry", value: Math.round(chemistry) },
    { label: "Balance", value: Math.round(balance) },
  ];

  return {
    overall: Math.round(overall),
    attack: Math.round(attack),
    midfield: Math.round(midfield),
    defence: Math.round(defence),
    goalkeeping: Math.round(goalkeeping),
    physical: Math.round(physical),
    chemistry: Math.round(chemistry),
    positionalFit: Math.round(weightedFit * 100),
    balance: Math.round(Math.max(0, Math.min(100, balance))),
    tacticalFit: Math.round(tacticalFit),
    tacticalIdentity,
    explanation,
    chemistryExplanation,
  };
}
