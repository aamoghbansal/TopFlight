/**
 * Demo-scale seed data: five real, iconic Premier League club-seasons with
 * their genuine first-team squads. Ratings/tiers/tactical tags below are
 * THIS GAME's own interpretation (never presented as an official rating —
 * see section 38 of the design spec). Honours listed under `achievements`
 * are real historical facts.
 *
 * This is intentionally a small, hand-curated slice so the full gameplay
 * loop (spin -> squad -> draft -> XI -> season) is genuinely playable end
 * to end right now. Section 37's import pipeline (data/*.json + a seed
 * script) is the intended path to scale this to the full 18,000+
 * player-season, five-league dataset later — this file is the format that
 * pipeline should target.
 */

export type SeedPosition =
  | "GK" | "LB" | "CB" | "RB" | "CDM" | "CM" | "CAM" | "LM" | "RM" | "LW" | "RW" | "ST" | "CF";

export interface SeedPlayerSeason {
  fullName: string;
  nationality: string;
  primaryPosition: SeedPosition;
  secondaryPositions: SeedPosition[];
  age: number;
  overall: number;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  diving?: number;
  handling?: number;
  reflexes?: number;
  gkPositioning?: number;
  distribution?: number;
  goals: number;
  assists: number;
  appearances: number;
  performanceTier: "S" | "A" | "B" | "C" | "D";
  tacticalTags: string[];
  achievements: string[];
}

export interface SeedClubSeason {
  clubName: string;
  clubShort: string;
  colorPrimary: string;
  seasonLabel: string;
  seasonStartYear: number;
  decade: "1990s" | "2000s" | "2010s" | "modern";
  finalPosition: number;
  notes: string;
  players: SeedPlayerSeason[];
}

export const PREMIER_LEAGUE_SEED: SeedClubSeason[] = [
  {
    clubName: "Arsenal",
    clubShort: "ARS",
    colorPrimary: "#EF0107",
    seasonLabel: "2003/04",
    seasonStartYear: 2003,
    decade: "2000s",
    finalPosition: 1,
    notes: "The Invincibles — unbeaten across the entire league campaign.",
    players: [
      { fullName: "Jens Lehmann", nationality: "Germany", primaryPosition: "GK", secondaryPositions: [], age: 34, overall: 84, diving: 84, handling: 83, reflexes: 86, gkPositioning: 85, distribution: 70, goals: 0, assists: 0, appearances: 38, performanceTier: "A", tacticalTags: ["shot-stopper", "vocal-organiser"], achievements: ["Premier League champion 2003/04"] },
      { fullName: "Lauren", nationality: "Cameroon", primaryPosition: "RB", secondaryPositions: ["CB"], age: 27, overall: 82, pace: 78, defending: 82, passing: 75, physical: 80, goals: 2, assists: 3, appearances: 33, performanceTier: "A", tacticalTags: ["reliable", "two-footed"], achievements: ["Premier League champion 2003/04"] },
      { fullName: "Sol Campbell", nationality: "England", primaryPosition: "CB", secondaryPositions: [], age: 29, overall: 87, pace: 78, defending: 89, physical: 88, passing: 74, goals: 2, assists: 0, appearances: 35, performanceTier: "S", tacticalTags: ["aerial-dominant", "leader"], achievements: ["Premier League champion 2003/04"] },
      { fullName: "Kolo Touré", nationality: "Ivory Coast", primaryPosition: "CB", secondaryPositions: ["RB"], age: 22, overall: 83, pace: 84, defending: 82, physical: 82, passing: 72, goals: 0, assists: 1, appearances: 33, performanceTier: "A", tacticalTags: ["athletic", "versatile"], achievements: ["Premier League champion 2003/04"] },
      { fullName: "Ashley Cole", nationality: "England", primaryPosition: "LB", secondaryPositions: ["LM"], age: 22, overall: 86, pace: 88, defending: 84, passing: 78, dribbling: 80, goals: 1, assists: 3, appearances: 34, performanceTier: "S", tacticalTags: ["attacking-fullback", "pacy"], achievements: ["Premier League champion 2003/04"] },
      { fullName: "Patrick Vieira", nationality: "France", primaryPosition: "CM", secondaryPositions: ["CDM"], age: 27, overall: 89, passing: 84, defending: 85, physical: 90, dribbling: 82, goals: 3, assists: 3, appearances: 30, performanceTier: "S", tacticalTags: ["box-to-box", "leader"], achievements: ["Premier League champion 2003/04", "Arsenal captain"] },
      { fullName: "Gilberto Silva", nationality: "Brazil", primaryPosition: "CDM", secondaryPositions: ["CM"], age: 27, overall: 84, passing: 80, defending: 82, physical: 84, dribbling: 75, goals: 3, assists: 2, appearances: 35, performanceTier: "A", tacticalTags: ["disciplined", "anchor"], achievements: ["Premier League champion 2003/04"] },
      { fullName: "Freddie Ljungberg", nationality: "Sweden", primaryPosition: "RM", secondaryPositions: ["CAM"], age: 26, overall: 84, pace: 83, dribbling: 82, passing: 78, shooting: 78, goals: 5, assists: 6, appearances: 26, performanceTier: "A", tacticalTags: ["late-runner", "energetic"], achievements: ["Premier League champion 2003/04"] },
      { fullName: "Robert Pirès", nationality: "France", primaryPosition: "LM", secondaryPositions: ["CAM"], age: 30, overall: 87, pace: 80, dribbling: 86, passing: 84, shooting: 82, goals: 14, assists: 5, appearances: 27, performanceTier: "S", tacticalTags: ["clinical-winger", "creative"], achievements: ["Premier League champion 2003/04", "PFA Players' Player of the Year"] },
      { fullName: "Thierry Henry", nationality: "France", primaryPosition: "ST", secondaryPositions: ["LW", "CF"], age: 26, overall: 93, pace: 94, shooting: 92, dribbling: 92, passing: 82, physical: 76, goals: 30, assists: 12, appearances: 37, performanceTier: "S", tacticalTags: ["clinical", "pace-merchant", "playmaker-striker"], achievements: ["Premier League champion 2003/04", "Golden Boot", "FWA Footballer of the Year"] },
      { fullName: "Dennis Bergkamp", nationality: "Netherlands", primaryPosition: "CF", secondaryPositions: ["CAM"], age: 34, overall: 86, passing: 88, dribbling: 88, shooting: 82, pace: 65, goals: 5, assists: 8, appearances: 27, performanceTier: "A", tacticalTags: ["creator", "false-nine"], achievements: ["Premier League champion 2003/04"] },
    ],
  },
  {
    clubName: "Manchester United",
    clubShort: "MUN",
    colorPrimary: "#DA291C",
    seasonLabel: "1998/99",
    seasonStartYear: 1998,
    decade: "1990s",
    finalPosition: 1,
    notes: "Treble winners — Premier League, FA Cup and Champions League.",
    players: [
      { fullName: "Peter Schmeichel", nationality: "Denmark", primaryPosition: "GK", secondaryPositions: [], age: 35, overall: 89, diving: 89, handling: 88, reflexes: 90, gkPositioning: 88, distribution: 78, goals: 0, assists: 0, appearances: 34, performanceTier: "S", tacticalTags: ["commanding", "shot-stopper"], achievements: ["Treble winner 1998/99"] },
      { fullName: "Gary Neville", nationality: "England", primaryPosition: "RB", secondaryPositions: ["CB"], age: 23, overall: 82, pace: 76, defending: 82, passing: 78, physical: 78, goals: 0, assists: 4, appearances: 32, performanceTier: "A", tacticalTags: ["reliable", "vocal"], achievements: ["Treble winner 1998/99"] },
      { fullName: "Jaap Stam", nationality: "Netherlands", primaryPosition: "CB", secondaryPositions: [], age: 26, overall: 89, pace: 82, defending: 91, physical: 90, passing: 76, goals: 1, assists: 1, appearances: 35, performanceTier: "S", tacticalTags: ["dominant", "aggressive-tackler"], achievements: ["Treble winner 1998/99"] },
      { fullName: "Ronny Johnsen", nationality: "Norway", primaryPosition: "CB", secondaryPositions: ["CDM"], age: 29, overall: 82, pace: 76, defending: 83, physical: 82, passing: 74, goals: 1, assists: 0, appearances: 20, performanceTier: "A", tacticalTags: ["versatile", "composed"], achievements: ["Treble winner 1998/99"] },
      { fullName: "Denis Irwin", nationality: "Ireland", primaryPosition: "LB", secondaryPositions: ["RB"], age: 33, overall: 83, pace: 74, defending: 82, passing: 80, physical: 76, goals: 3, assists: 5, appearances: 34, performanceTier: "A", tacticalTags: ["dependable", "set-piece-taker"], achievements: ["Treble winner 1998/99"] },
      { fullName: "David Beckham", nationality: "England", primaryPosition: "RM", secondaryPositions: ["CM"], age: 23, overall: 88, passing: 90, shooting: 84, dribbling: 80, pace: 78, goals: 9, assists: 12, appearances: 34, performanceTier: "S", tacticalTags: ["crosser", "set-piece-specialist"], achievements: ["Treble winner 1998/99"] },
      { fullName: "Roy Keane", nationality: "Ireland", primaryPosition: "CM", secondaryPositions: ["CDM"], age: 27, overall: 88, passing: 82, defending: 84, physical: 86, dribbling: 78, goals: 4, assists: 3, appearances: 32, performanceTier: "S", tacticalTags: ["leader", "box-to-box", "captain"], achievements: ["Treble winner 1998/99", "Manchester United captain"] },
      { fullName: "Paul Scholes", nationality: "England", primaryPosition: "CM", secondaryPositions: ["CAM"], age: 23, overall: 86, passing: 88, shooting: 82, dribbling: 78, physical: 74, goals: 6, assists: 4, appearances: 20, performanceTier: "A", tacticalTags: ["passer", "long-range-shooter"], achievements: ["Treble winner 1998/99"] },
      { fullName: "Ryan Giggs", nationality: "Wales", primaryPosition: "LM", secondaryPositions: ["LW"], age: 25, overall: 87, pace: 90, dribbling: 88, passing: 79, shooting: 76, goals: 6, assists: 8, appearances: 31, performanceTier: "S", tacticalTags: ["pace-merchant", "dribbler"], achievements: ["Treble winner 1998/99"] },
      { fullName: "Dwight Yorke", nationality: "Trinidad and Tobago", primaryPosition: "ST", secondaryPositions: ["CF"], age: 27, overall: 87, pace: 80, shooting: 86, dribbling: 84, passing: 76, goals: 18, assists: 8, appearances: 32, performanceTier: "S", tacticalTags: ["clinical", "link-up-play"], achievements: ["Treble winner 1998/99", "Premier League top scorer joint"] },
      { fullName: "Andy Cole", nationality: "England", primaryPosition: "ST", secondaryPositions: ["CF"], age: 27, overall: 85, pace: 86, shooting: 85, dribbling: 78, passing: 68, goals: 17, assists: 6, appearances: 33, performanceTier: "A", tacticalTags: ["poacher", "pace-merchant"], achievements: ["Treble winner 1998/99"] },
    ],
  },
  {
    clubName: "Liverpool",
    clubShort: "LIV",
    colorPrimary: "#C8102E",
    seasonLabel: "2019/20",
    seasonStartYear: 2019,
    decade: "modern",
    finalPosition: 1,
    notes: "Ended a 30-year wait for the league title, champions by mid-June.",
    players: [
      { fullName: "Alisson Becker", nationality: "Brazil", primaryPosition: "GK", secondaryPositions: [], age: 27, overall: 89, diving: 88, handling: 87, reflexes: 90, gkPositioning: 88, distribution: 84, goals: 0, assists: 1, appearances: 33, performanceTier: "S", tacticalTags: ["sweeper-keeper", "distributor"], achievements: ["Premier League champion 2019/20"] },
      { fullName: "Trent Alexander-Arnold", nationality: "England", primaryPosition: "RB", secondaryPositions: ["RM"], age: 21, overall: 87, pace: 78, passing: 88, defending: 78, dribbling: 78, goals: 0, assists: 13, appearances: 37, performanceTier: "S", tacticalTags: ["creator", "set-piece-specialist"], achievements: ["Premier League champion 2019/20"] },
      { fullName: "Virgil van Dijk", nationality: "Netherlands", primaryPosition: "CB", secondaryPositions: [], age: 28, overall: 92, pace: 79, defending: 92, physical: 87, passing: 82, goals: 1, assists: 1, appearances: 36, performanceTier: "S", tacticalTags: ["dominant", "ball-playing-defender", "leader"], achievements: ["Premier League champion 2019/20", "UEFA Men's Player of the Year 2018/19"] },
      { fullName: "Joe Gomez", nationality: "England", primaryPosition: "CB", secondaryPositions: ["RB"], age: 22, overall: 82, pace: 80, defending: 81, physical: 80, passing: 74, goals: 0, assists: 0, appearances: 26, performanceTier: "A", tacticalTags: ["athletic", "versatile"], achievements: ["Premier League champion 2019/20"] },
      { fullName: "Andrew Robertson", nationality: "Scotland", primaryPosition: "LB", secondaryPositions: ["LM"], age: 25, overall: 86, pace: 82, defending: 80, passing: 82, physical: 78, goals: 0, assists: 12, appearances: 35, performanceTier: "S", tacticalTags: ["attacking-fullback", "relentless"], achievements: ["Premier League champion 2019/20"] },
      { fullName: "Fabinho", nationality: "Brazil", primaryPosition: "CDM", secondaryPositions: ["CB"], age: 26, overall: 85, passing: 80, defending: 84, physical: 84, dribbling: 76, goals: 1, assists: 1, appearances: 26, performanceTier: "A", tacticalTags: ["destroyer", "anchor"], achievements: ["Premier League champion 2019/20"] },
      { fullName: "Jordan Henderson", nationality: "England", primaryPosition: "CM", secondaryPositions: ["CDM"], age: 29, overall: 84, passing: 82, defending: 76, physical: 80, dribbling: 76, goals: 4, assists: 8, appearances: 34, performanceTier: "A", tacticalTags: ["leader", "captain", "energetic"], achievements: ["Premier League champion 2019/20", "FWA Footballer of the Year", "Liverpool captain"] },
      { fullName: "Georginio Wijnaldum", nationality: "Netherlands", primaryPosition: "CM", secondaryPositions: ["CDM"], age: 28, overall: 83, passing: 80, defending: 76, physical: 82, dribbling: 78, goals: 1, assists: 3, appearances: 35, performanceTier: "A", tacticalTags: ["work-rate", "tidy-passer"], achievements: ["Premier League champion 2019/20"] },
      { fullName: "Mohamed Salah", nationality: "Egypt", primaryPosition: "RW", secondaryPositions: ["ST"], age: 27, overall: 90, pace: 90, shooting: 87, dribbling: 88, passing: 78, goals: 19, assists: 10, appearances: 34, performanceTier: "S", tacticalTags: ["clinical", "pace-merchant", "inverted-winger"], achievements: ["Premier League champion 2019/20"] },
      { fullName: "Roberto Firmino", nationality: "Brazil", primaryPosition: "CF", secondaryPositions: ["ST"], age: 28, overall: 87, dribbling: 85, passing: 82, shooting: 82, pace: 78, goals: 9, assists: 12, appearances: 35, performanceTier: "A", tacticalTags: ["false-nine", "link-up-play", "presser"], achievements: ["Premier League champion 2019/20"] },
      { fullName: "Sadio Mané", nationality: "Senegal", primaryPosition: "LW", secondaryPositions: ["ST"], age: 27, overall: 89, pace: 91, shooting: 85, dribbling: 87, passing: 76, goals: 18, assists: 7, appearances: 34, performanceTier: "S", tacticalTags: ["pace-merchant", "direct-runner"], achievements: ["Premier League champion 2019/20"] },
    ],
  },
  {
    clubName: "Manchester City",
    clubShort: "MCI",
    colorPrimary: "#6CABDD",
    seasonLabel: "2017/18",
    seasonStartYear: 2017,
    decade: "modern",
    finalPosition: 1,
    notes: "The Centurions — first English top-flight side to reach 100 points.",
    players: [
      { fullName: "Ederson", nationality: "Brazil", primaryPosition: "GK", secondaryPositions: [], age: 24, overall: 87, diving: 85, handling: 84, reflexes: 87, gkPositioning: 85, distribution: 90, goals: 0, assists: 1, appearances: 33, performanceTier: "S", tacticalTags: ["sweeper-keeper", "elite-distributor"], achievements: ["Premier League champion 2017/18"] },
      { fullName: "Kyle Walker", nationality: "England", primaryPosition: "RB", secondaryPositions: ["CB"], age: 27, overall: 85, pace: 92, defending: 80, passing: 76, physical: 80, goals: 0, assists: 4, appearances: 32, performanceTier: "A", tacticalTags: ["pace-merchant", "recovery-runs"], achievements: ["Premier League champion 2017/18"] },
      { fullName: "John Stones", nationality: "England", primaryPosition: "CB", secondaryPositions: [], age: 23, overall: 83, pace: 78, defending: 82, passing: 80, physical: 78, goals: 2, assists: 1, appearances: 27, performanceTier: "A", tacticalTags: ["ball-playing-defender", "composed"], achievements: ["Premier League champion 2017/18"] },
      { fullName: "Nicolás Otamendi", nationality: "Argentina", primaryPosition: "CB", secondaryPositions: [], age: 29, overall: 82, pace: 76, defending: 83, physical: 84, passing: 74, goals: 2, assists: 1, appearances: 32, performanceTier: "A", tacticalTags: ["aggressive", "physical"], achievements: ["Premier League champion 2017/18"] },
      { fullName: "Benjamin Mendy", nationality: "France", primaryPosition: "LB", secondaryPositions: ["LM"], age: 23, overall: 82, pace: 88, defending: 76, passing: 76, physical: 80, goals: 0, assists: 3, appearances: 15, performanceTier: "B", tacticalTags: ["attacking-fullback", "explosive"], achievements: ["Premier League champion 2017/18"] },
      { fullName: "Fernandinho", nationality: "Brazil", primaryPosition: "CDM", secondaryPositions: ["CB"], age: 32, overall: 85, passing: 82, defending: 82, physical: 80, dribbling: 78, goals: 3, assists: 5, appearances: 33, performanceTier: "A", tacticalTags: ["anchor", "tactically-disciplined"], achievements: ["Premier League champion 2017/18"] },
      { fullName: "Kevin De Bruyne", nationality: "Belgium", primaryPosition: "CM", secondaryPositions: ["CAM"], age: 26, overall: 91, passing: 93, shooting: 84, dribbling: 86, physical: 76, goals: 8, assists: 16, appearances: 32, performanceTier: "S", tacticalTags: ["elite-playmaker", "long-range-passer"], achievements: ["Premier League champion 2017/18", "PFA Players' Player of the Year"] },
      { fullName: "David Silva", nationality: "Spain", primaryPosition: "CAM", secondaryPositions: ["CM"], age: 31, overall: 87, passing: 88, dribbling: 88, shooting: 78, pace: 70, goals: 5, assists: 11, appearances: 32, performanceTier: "S", tacticalTags: ["creator", "tight-control"], achievements: ["Premier League champion 2017/18"] },
      { fullName: "Leroy Sané", nationality: "Germany", primaryPosition: "LW", secondaryPositions: ["ST"], age: 21, overall: 84, pace: 92, dribbling: 84, shooting: 78, passing: 76, goals: 14, assists: 15, appearances: 31, performanceTier: "A", tacticalTags: ["pace-merchant", "direct-runner"], achievements: ["Premier League champion 2017/18", "PFA Young Player of the Year"] },
      { fullName: "Sergio Agüero", nationality: "Argentina", primaryPosition: "ST", secondaryPositions: ["CF"], age: 29, overall: 89, pace: 84, shooting: 90, dribbling: 86, passing: 76, goals: 21, assists: 8, appearances: 27, performanceTier: "S", tacticalTags: ["clinical", "poacher"], achievements: ["Premier League champion 2017/18"] },
      { fullName: "Raheem Sterling", nationality: "England", primaryPosition: "RW", secondaryPositions: ["ST"], age: 23, overall: 84, pace: 90, dribbling: 85, shooting: 78, passing: 76, goals: 18, assists: 11, appearances: 33, performanceTier: "A", tacticalTags: ["pace-merchant", "direct-runner"], achievements: ["Premier League champion 2017/18"] },
    ],
  },
  {
    clubName: "Chelsea",
    clubShort: "CHE",
    colorPrimary: "#034694",
    seasonLabel: "2004/05",
    seasonStartYear: 2004,
    decade: "2000s",
    finalPosition: 1,
    notes: "José Mourinho's first title — a then-record 95 points, 15 goals conceded.",
    players: [
      { fullName: "Petr Čech", nationality: "Czech Republic", primaryPosition: "GK", secondaryPositions: [], age: 22, overall: 87, diving: 87, handling: 85, reflexes: 88, gkPositioning: 88, distribution: 72, goals: 0, assists: 0, appearances: 35, performanceTier: "S", tacticalTags: ["shot-stopper", "commanding"], achievements: ["Premier League champion 2004/05", "Golden Glove"] },
      { fullName: "Paulo Ferreira", nationality: "Portugal", primaryPosition: "RB", secondaryPositions: ["CB"], age: 25, overall: 81, pace: 78, defending: 80, passing: 76, physical: 76, goals: 0, assists: 2, appearances: 30, performanceTier: "B", tacticalTags: ["dependable", "positional"], achievements: ["Premier League champion 2004/05"] },
      { fullName: "John Terry", nationality: "England", primaryPosition: "CB", secondaryPositions: [], age: 24, overall: 87, pace: 74, defending: 89, physical: 88, passing: 76, goals: 3, assists: 1, appearances: 37, performanceTier: "S", tacticalTags: ["leader", "aerial-dominant", "captain"], achievements: ["Premier League champion 2004/05", "PFA Players' Player of the Year", "Chelsea captain"] },
      { fullName: "Ricardo Carvalho", nationality: "Portugal", primaryPosition: "CB", secondaryPositions: [], age: 26, overall: 85, pace: 78, defending: 86, physical: 82, passing: 76, goals: 1, assists: 0, appearances: 31, performanceTier: "A", tacticalTags: ["composed", "reader-of-the-game"], achievements: ["Premier League champion 2004/05"] },
      { fullName: "William Gallas", nationality: "France", primaryPosition: "LB", secondaryPositions: ["CB"], age: 27, overall: 84, pace: 80, defending: 83, passing: 76, physical: 80, goals: 1, assists: 1, appearances: 32, performanceTier: "A", tacticalTags: ["versatile", "combative"], achievements: ["Premier League champion 2004/05"] },
      { fullName: "Claude Makélélé", nationality: "France", primaryPosition: "CDM", secondaryPositions: [], age: 31, overall: 86, passing: 78, defending: 87, physical: 82, dribbling: 76, goals: 0, assists: 2, appearances: 33, performanceTier: "A", tacticalTags: ["destroyer", "anchor", "positional-master"], achievements: ["Premier League champion 2004/05"] },
      { fullName: "Frank Lampard", nationality: "England", primaryPosition: "CM", secondaryPositions: ["CAM"], age: 26, overall: 89, passing: 85, shooting: 86, physical: 82, dribbling: 78, goals: 13, assists: 6, appearances: 38, performanceTier: "S", tacticalTags: ["box-to-box", "late-runner", "clinical"], achievements: ["Premier League champion 2004/05", "FWA Footballer of the Year"] },
      { fullName: "Tiago", nationality: "Portugal", primaryPosition: "CM", secondaryPositions: ["CDM"], age: 26, overall: 82, passing: 82, defending: 76, physical: 78, dribbling: 78, goals: 2, assists: 3, appearances: 24, performanceTier: "B", tacticalTags: ["tidy-passer", "tactically-flexible"], achievements: ["Premier League champion 2004/05"] },
      { fullName: "Arjen Robben", nationality: "Netherlands", primaryPosition: "RW", secondaryPositions: ["LW"], age: 20, overall: 83, pace: 88, dribbling: 87, shooting: 80, passing: 76, goals: 4, assists: 5, appearances: 21, performanceTier: "A", tacticalTags: ["inverted-winger", "dribbler"], achievements: ["Premier League champion 2004/05"] },
      { fullName: "Didier Drogba", nationality: "Ivory Coast", primaryPosition: "ST", secondaryPositions: ["CF"], age: 26, overall: 86, pace: 82, shooting: 86, physical: 88, dribbling: 82, passing: 74, goals: 10, assists: 5, appearances: 29, performanceTier: "A", tacticalTags: ["target-man", "physical"], achievements: ["Premier League champion 2004/05"] },
      { fullName: "Eiður Guðjohnsen", nationality: "Iceland", primaryPosition: "CF", secondaryPositions: ["ST"], age: 26, overall: 82, shooting: 80, passing: 78, dribbling: 78, pace: 74, goals: 10, assists: 8, appearances: 31, performanceTier: "B", tacticalTags: ["link-up-play", "versatile-forward"], achievements: ["Premier League champion 2004/05"] },
    ],
  },
];
