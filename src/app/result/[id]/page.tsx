"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Trophy,
  Shield,
  RefreshCw,
  Flame,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

interface SeasonResult {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  finalPosition: number;
  longestUnbeatenStreak: number;
  longestWinStreak: number;
  cleanSheets: number;
  gameScore: string;
  isPerfectSeason: boolean;
  isInvincible: boolean;
}

interface MatchdayResult {
  matchday: number;
  isHome: boolean;
  opponentIndex: number;
  opponentName: string;
  result: {
    userGoals: number;
    opponentGoals: number;
    userXG?: number;
    oppXG?: number;
    userPossessionPct?: number;
    oppPossessionPct?: number;
    events?: { minute: number; type: string; team: string; player?: string }[];
  };
}

interface TeamPlayer {
  id: number;
  fullName: string;
  nationality: string;
  primaryPosition: string;
  secondaryPositions: string;
  overall: number;
  goals: number;
  assists: number;
  appearances: number;
  slotRole: string;
}

interface TeamDetails {
  id: number;
  name: string;
  overall: number;
  attack: number;
  midfield: number;
  defence: number;
  goalkeeping: number;
  chemistry: number;
  positionalFit: number;
}

export default function ResultPage() {
  const params = useParams();
  const draftId = params.id as string;

  const [result, setResult] = useState<SeasonResult | null>(null);
  const [matchdays, setMatchdays] = useState<MatchdayResult[]>([]);
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "fixtures" | "squad">("overview");
  const [matchFilter, setMatchFilter] = useState<"ALL" | "W" | "D" | "L">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      setLoading(true);
      try {
        const res = await fetch(`/api/drafts/${draftId}/simulate`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Simulation failed");

        setResult(data.seasonResult);
        if (data.matchdayResults) setMatchdays(data.matchdayResults);
        if (data.team) setTeam(data.team);
        if (data.teamPlayers) setTeamPlayers(data.teamPlayers);

        // Trigger confetti celebration for Champions or S/S+ grade
        if (data.seasonResult?.finalPosition === 1 || data.seasonResult?.gameScore === "S+" || data.seasonResult?.gameScore === "S") {
          setTimeout(() => {
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
            });
          }, 300);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Simulation failed");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [draftId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-400">
        <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-black text-neutral-100">Simulating 38-Matchday Season…</h2>
        <p className="text-xs text-neutral-500 mt-2 font-medium">Computing tactical probabilities, goal lines & league tables</p>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-400">
        <div className="max-w-md p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-center shadow-2xl">
          <div className="text-rose-400 font-bold text-lg mb-2">Simulation Notice</div>
          <p className="text-sm text-neutral-400 mb-6">{error || "Unable to retrieve season results."}</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/draft/${draftId}`}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-bold text-neutral-200 transition cursor-pointer"
            >
              Return to Draft
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-black text-neutral-950 transition cursor-pointer"
            >
              New Draft
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const goalDiff = result.goalsFor - result.goalsAgainst;

  const filteredMatches = matchdays.filter((m) => {
    if (matchFilter === "ALL") return true;
    if (matchFilter === "W") return m.result.userGoals > m.result.opponentGoals;
    if (matchFilter === "D") return m.result.userGoals === m.result.opponentGoals;
    if (matchFilter === "L") return m.result.userGoals < m.result.opponentGoals;
    return true;
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-20">
      {/* Top Navigation */}
      <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-neutral-950 font-black text-lg shadow-md">
              ⚡
            </div>
            <div>
              <span className="font-black text-base text-neutral-100 tracking-tight block">TopFlight XI</span>
              <span className="text-[11px] text-neutral-400 block -mt-0.5 font-medium">Season Simulation Review</span>
            </div>
          </Link>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Draft New Squad</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div className="rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
                  Season Complete
                </span>
                {result.finalPosition === 1 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Champions 🏆
                  </span>
                )}
                {result.isInvincible && (
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-neutral-950 text-xs font-black">
                    ⚡ The Invincibles
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-neutral-100 tracking-tight">
                Finished #{result.finalPosition} with {result.points} Points
              </h1>
              <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
                Your drafted squad recorded {result.wins} wins, {result.draws} draws, and {result.losses} losses across 38 matches, scoring {result.goalsFor} goals and conceding {result.goalsAgainst}.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                {result.isPerfectSeason && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                    🌟 Perfect Season (38-0-0)
                  </span>
                )}
                {result.points >= 100 && (
                  <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold">
                    💯 100-Point Club
                  </span>
                )}
                {result.cleanSheets >= 15 && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                    🛡️ Clean Sheet Titan ({result.cleanSheets})
                  </span>
                )}
              </div>
            </div>

            {/* Score Grade Stamp */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl min-w-[160px]">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Season Score</span>
              <div
                className={`text-6xl sm:text-7xl font-black font-mono tracking-tighter my-1 ${
                  result.gameScore.startsWith("S")
                    ? "text-amber-400"
                    : result.gameScore.startsWith("A")
                    ? "text-emerald-400"
                    : "text-sky-400"
                }`}
              >
                {result.gameScore}
              </div>
              <span className="text-[11px] text-neutral-400 font-semibold">Performance Grade</span>
            </div>
          </div>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
          <StatCard label="Played" value={result.played} />
          <StatCard label="Wins" value={result.wins} highlight="text-emerald-400" />
          <StatCard label="Draws" value={result.draws} />
          <StatCard label="Losses" value={result.losses} highlight={result.losses === 0 ? "text-amber-400" : ""} />
          <StatCard label="Points" value={result.points} highlight="text-emerald-400" />
          <StatCard label="Goals For" value={result.goalsFor} />
          <StatCard label="Goals Ag." value={result.goalsAgainst} />
          <StatCard
            label="Goal Diff"
            value={goalDiff > 0 ? `+${goalDiff}` : goalDiff}
            highlight={goalDiff > 0 ? "text-emerald-400" : ""}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 border-b border-neutral-800 pb-3">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<Trophy className="w-4 h-4" />}
            label="Season Overview"
          />
          <TabButton
            active={activeTab === "fixtures"}
            onClick={() => setActiveTab("fixtures")}
            icon={<Calendar className="w-4 h-4" />}
            label={`Fixtures (${matchdays.length})`}
          />
          <TabButton
            active={activeTab === "squad"}
            onClick={() => setActiveTab("squad")}
            icon={<Layers className="w-4 h-4" />}
            label={`Squad XI (${teamPlayers.length})`}
          />
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {team && (
              <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
                <h3 className="font-bold text-base text-neutral-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Calculated Tactical Ratings</span>
                </h3>

                <div className="space-y-3">
                  <RatingBar label="Team Overall" value={team.overall} />
                  <RatingBar label="Attack" value={team.attack} />
                  <RatingBar label="Midfield" value={team.midfield} />
                  <RatingBar label="Defence" value={team.defence} />
                  <RatingBar label="Goalkeeping" value={team.goalkeeping} />
                  <RatingBar label="Chemistry Link" value={team.chemistry} />
                  <RatingBar label="Positional Fit" value={team.positionalFit} />
                </div>
              </div>
            )}

            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-neutral-100 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Campaign Streaks & Highlights</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {result.longestUnbeatenStreak}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 font-medium">Longest Unbeaten Run</div>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {result.longestWinStreak}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 font-medium">Longest Winning Run</div>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div className="text-2xl font-black font-mono text-sky-400">
                    {result.cleanSheets}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 font-medium">Clean Sheets Kept</div>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div className="text-2xl font-black font-mono text-amber-400">
                    {result.points >= 90 ? "Dominant" : result.points >= 75 ? "Contender" : "Midtable"}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 font-medium">Campaign Narrative</div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Inspect every match in the <strong>Fixtures</strong> tab or review individual player ratings in the <strong>Squad XI</strong> tab.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Fixtures */}
        {activeTab === "fixtures" && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {(["ALL", "W", "D", "L"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMatchFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                      matchFilter === f
                        ? "bg-emerald-500 text-neutral-950 shadow-md"
                        : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {f === "ALL" ? "All Fixtures" : f === "W" ? "Wins" : f === "D" ? "Draws" : "Losses"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                Showing {filteredMatches.length} matchdays
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMatches.map((m) => {
                const isWin = m.result.userGoals > m.result.opponentGoals;
                const isDraw = m.result.userGoals === m.result.opponentGoals;

                return (
                  <div
                    key={m.matchday}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition shadow-md ${
                      isWin
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : isDraw
                        ? "border-neutral-700 bg-neutral-900/80"
                        : "border-rose-500/40 bg-rose-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-neutral-500 w-8">
                        MD {m.matchday}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
                          <span>{m.isHome ? "vs" : "@"}</span>
                          <span>{m.opponentName}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                          {m.isHome ? "Home Match" : "Away Match"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-base font-black font-mono px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800">
                        {m.result.userGoals} - {m.result.opponentGoals}
                      </div>
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          isWin
                            ? "bg-emerald-500 text-neutral-950"
                            : isDraw
                            ? "bg-neutral-700 text-neutral-200"
                            : "bg-rose-500 text-white"
                        }`}
                      >
                        {isWin ? "W" : isDraw ? "D" : "L"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Squad XI */}
        {activeTab === "squad" && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamPlayers.map((player) => (
              <div
                key={player.id}
                className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-start justify-between gap-3 shadow-xl"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-black bg-neutral-800 text-emerald-400 border border-neutral-700">
                      {player.slotRole}
                    </span>
                    <span className="font-black text-sm text-neutral-100">{player.fullName}</span>
                  </div>
                  <div className="text-xs text-neutral-400">{player.nationality}</div>
                  <div className="text-[11px] text-neutral-500 pt-1 flex items-center gap-3">
                    <span>Apps: <strong className="text-neutral-200">{player.appearances}</strong></span>
                    <span>Goals: <strong className="text-neutral-200">{player.goals}</strong></span>
                    <span>Assists: <strong className="text-neutral-200">{player.assists}</strong></span>
                  </div>
                </div>

                <div className="text-xl font-black font-mono text-amber-300 px-3 py-1 rounded-2xl bg-amber-500/15 border border-amber-500/40 shadow-md">
                  {player.overall}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight = "",
}: {
  label: string;
  value: string | number;
  highlight?: string;
}) {
  return (
    <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-center shadow-md">
      <div className={`text-xl font-black font-mono ${highlight || "text-neutral-100"}`}>
        {value}
      </div>
      <div className="text-[11px] text-neutral-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95 ${
        active
          ? "bg-emerald-500 text-neutral-950 shadow-md"
          : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-neutral-400 font-medium">{label}</span>
        <span className="font-mono font-bold text-neutral-200">{value}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            value >= 85
              ? "bg-amber-400"
              : value >= 75
              ? "bg-emerald-400"
              : "bg-sky-400"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
