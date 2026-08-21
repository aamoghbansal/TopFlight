export type Role =
  | "GK"
  | "LB" | "CB" | "RB"
  | "CDM" | "CM" | "CAM" | "LM" | "RM"
  | "LW" | "RW" | "ST" | "CF";

export interface FormationSlotConfig {
  slotOrder: number;
  primaryRole: Role;
  eligibleSecondaryRoles: Role[];
  positionalFitWeight: number; // how much this slot's fit affects team rating
  tacticalImportance: number; // how much this slot's OVR affects tactical identity
}

export interface FormationConfig {
  code: string;
  label: string;
  slots: FormationSlotConfig[];
}

// Roles that can reasonably deputize for each other — used to build
// eligibleSecondaryRoles for every formation automatically instead of
// re-typing role compatibility per formation.
const ROLE_NEIGHBORS: Record<Role, Role[]> = {
  GK: [],
  LB: ["CB", "LM"],
  CB: ["LB", "RB"],
  RB: ["CB", "RM"],
  CDM: ["CM", "CB"],
  CM: ["CDM", "CAM"],
  CAM: ["CM", "LW", "RW"],
  LM: ["LB", "LW", "CM"],
  RM: ["RB", "RW", "CM"],
  LW: ["LM", "CAM", "ST"],
  RW: ["RM", "CAM", "ST"],
  ST: ["CF", "LW", "RW"],
  CF: ["ST", "CAM"],
};

function slot(order: number, role: Role, fit = 1.0, tactical = 1.0): FormationSlotConfig {
  return {
    slotOrder: order,
    primaryRole: role,
    eligibleSecondaryRoles: ROLE_NEIGHBORS[role],
    positionalFitWeight: fit,
    tacticalImportance: tactical,
  };
}

export const FORMATIONS: FormationConfig[] = [
  {
    code: "4-3-3",
    label: "4-3-3",
    slots: [
      slot(1, "GK", 1.2),
      slot(2, "LB"), slot(3, "CB", 1.1), slot(4, "CB", 1.1), slot(5, "RB"),
      slot(6, "CM", 1.0, 1.1), slot(7, "CM", 1.0, 1.1), slot(8, "CM", 1.0, 1.1),
      slot(9, "LW", 0.9, 1.2), slot(10, "ST", 1.0, 1.3), slot(11, "RW", 0.9, 1.2),
    ],
  },
  {
    code: "4-4-2",
    label: "4-4-2",
    slots: [
      slot(1, "GK", 1.2),
      slot(2, "LB"), slot(3, "CB", 1.1), slot(4, "CB", 1.1), slot(5, "RB"),
      slot(6, "LM", 0.9), slot(7, "CM", 1.0, 1.1), slot(8, "CM", 1.0, 1.1), slot(9, "RM", 0.9),
      slot(10, "ST", 1.0, 1.3), slot(11, "ST", 1.0, 1.3),
    ],
  },
  {
    code: "4-2-3-1",
    label: "4-2-3-1",
    slots: [
      slot(1, "GK", 1.2),
      slot(2, "LB"), slot(3, "CB", 1.1), slot(4, "CB", 1.1), slot(5, "RB"),
      slot(6, "CDM", 1.1, 1.1), slot(7, "CDM", 1.1, 1.1),
      slot(8, "LW", 0.9, 1.1), slot(9, "CAM", 1.0, 1.2), slot(10, "RW", 0.9, 1.1),
      slot(11, "ST", 1.0, 1.3),
    ],
  },
  {
    code: "4-5-1",
    label: "4-5-1",
    slots: [
      slot(1, "GK", 1.2),
      slot(2, "LB"), slot(3, "CB", 1.1), slot(4, "CB", 1.1), slot(5, "RB"),
      slot(6, "LM", 0.9), slot(7, "CDM", 1.0), slot(8, "CM", 1.0, 1.1), slot(9, "RM", 0.9),
      slot(10, "ST", 1.0, 1.3), slot(11, "CAM", 0.9, 1.1),
    ],
  },
  {
    code: "3-4-3",
    label: "3-4-3",
    slots: [
      slot(1, "GK", 1.2),
      slot(2, "CB", 1.15), slot(3, "CB", 1.15), slot(4, "CB", 1.15),
      slot(5, "LM", 0.9), slot(6, "CM", 1.0, 1.1), slot(7, "CM", 1.0, 1.1), slot(8, "RM", 0.9),
      slot(9, "LW", 0.9, 1.2), slot(10, "ST", 1.0, 1.3), slot(11, "RW", 0.9, 1.2),
    ],
  },
  {
    code: "3-5-2",
    label: "3-5-2",
    slots: [
      slot(1, "GK", 1.2),
      slot(2, "CB", 1.15), slot(3, "CB", 1.15), slot(4, "CB", 1.15),
      slot(5, "LM", 0.9), slot(6, "CDM", 1.0), slot(7, "CM", 1.0, 1.1), slot(8, "CAM", 0.9, 1.1), slot(9, "RM", 0.9),
      slot(10, "ST", 1.0, 1.3), slot(11, "ST", 1.0, 1.3),
    ],
  },
  {
    code: "5-4-1",
    label: "5-4-1",
    slots: [
      slot(1, "GK", 1.2),
      slot(2, "LB"), slot(3, "CB", 1.1), slot(4, "CB", 1.1), slot(5, "CB", 1.1), slot(6, "RB"),
      slot(7, "LM", 0.9), slot(8, "CM", 1.0, 1.1), slot(9, "CM", 1.0, 1.1), slot(10, "RM", 0.9),
      slot(11, "ST", 1.0, 1.3),
    ],
  },
];

export function getFormation(code: string): FormationConfig | undefined {
  return FORMATIONS.find((f) => f.code === code);
}
