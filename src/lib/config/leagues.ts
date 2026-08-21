export interface LeagueConfig {
  code: string;
  country: string;
  name: string;
  numClubs: number;
  seasonStart: number;
  seasonEnd: number;
  pointsForWin: number;
  pointsForDraw: number;
}

// matchesPerClub is ALWAYS derived, never hard-coded: (numClubs - 1) * 2
export function matchesPerClub(numClubs: number): number {
  return (numClubs - 1) * 2;
}

export const LEAGUES: LeagueConfig[] = [
  {
    code: "PL",
    country: "England",
    name: "Premier League",
    numClubs: 20,
    seasonStart: 1992,
    seasonEnd: 2026,
    pointsForWin: 3,
    pointsForDraw: 1,
  },
  {
    code: "LALIGA",
    country: "Spain",
    name: "La Liga",
    numClubs: 20,
    seasonStart: 1992,
    seasonEnd: 2026,
    pointsForWin: 3,
    pointsForDraw: 1,
  },
  {
    code: "SERIEA",
    country: "Italy",
    name: "Serie A",
    numClubs: 20,
    seasonStart: 1992,
    seasonEnd: 2026,
    pointsForWin: 3,
    pointsForDraw: 1,
  },
  {
    code: "BUNDESLIGA",
    country: "Germany",
    name: "Bundesliga",
    numClubs: 18,
    seasonStart: 1992,
    seasonEnd: 2026,
    pointsForWin: 3,
    pointsForDraw: 1,
  },
  {
    code: "LIGUE1",
    country: "France",
    name: "Ligue 1",
    numClubs: 18,
    seasonStart: 1992,
    seasonEnd: 2026,
    pointsForWin: 3,
    pointsForDraw: 1,
  },
];
