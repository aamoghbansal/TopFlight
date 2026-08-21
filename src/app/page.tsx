"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Shield,
  Sparkles,
  Play,
  Sliders,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface League {
  id: number;
  code: string;
  name: string;
  country: string;
  numClubs: number;
  matchesPerClub: number;
}

interface Formation {
  code: string;
  label: string;
  slotCount: number;
}

const DEFAULT_LEAGUES: League[] = [
  { id: 1, code: "PL", name: "Premier League", country: "England", numClubs: 20, matchesPerClub: 38 },
  { id: 2, code: "LL", name: "La Liga", country: "Spain", numClubs: 20, matchesPerClub: 38 },
  { id: 3, code: "SA", name: "Serie A", country: "Italy", numClubs: 20, matchesPerClub: 38 },
  { id: 4, code: "BL", name: "Bundesliga", country: "Germany", numClubs: 18, matchesPerClub: 34 },
];

const DEFAULT_FORMATIONS: Formation[] = [
  { code: "4-3-3", label: "4-3-3 Attack", slotCount: 11 },
  { code: "4-4-2", label: "4-4-2 Classic", slotCount: 11 },
  { code: "4-2-3-1", label: "4-2-3-1 Modern", slotCount: 11 },
  { code: "3-5-2", label: "3-5-2 Wingbacks", slotCount: 11 },
  { code: "3-4-3", label: "3-4-3 Total Football", slotCount: 11 },
  { code: "5-4-1", label: "5-4-1 Lockdown", slotCount: 11 },
];

export default function HomePage() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>(DEFAULT_LEAGUES);
  const [formations, setFormations] = useState<Formation[]>(DEFAULT_FORMATIONS);
  const [leagueCode, setLeagueCode] = useState("PL");
  const [formationCode, setFormationCode] = useState("4-3-3");
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [ratingVisibility, setRatingVisibility] = useState<"visible" | "blind">("visible");
  const [ratingModel, setRatingModel] = useState<"career_season" | "prime">("career_season");
  const [era] = useState("all_time");
  const [seasonReveal] = useState("instant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((d) => {
        if (d.leagues && d.leagues.length > 0) setLeagues(d.leagues);
      })
      .catch(() => {});

    fetch("/api/formations")
      .then((r) => r.json())
      .then((d) => {
        if (d.formations && d.formations.length > 0) setFormations(d.formations);
      })
      .catch(() => {});
  }, []);

  async function startDraft(customConfig?: { league?: string; formation?: string; diff?: "easy" | "normal" | "hard" }) {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        leagueCode: customConfig?.league || leagueCode,
        formationCode: customConfig?.formation || formationCode,
        difficulty: customConfig?.diff || difficulty,
        ratingVisibility,
        era,
        seasonReveal,
        mode: "classic",
        ratingModel,
      };

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Failed to create draft session");
      if (data.draft && data.draft.id) {
        router.push(`/draft/${data.draft.id}`);
      } else {
        throw new Error("No draft ID returned");
      }
    } catch (e) {
      console.error("Failed to start draft:", e);
      setError(e instanceof Error ? e.message : "Something went wrong starting draft");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-20">
      {/* Top Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-neutral-950 font-black text-xl shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block">TopFlight XI</span>
              <span className="text-xs text-neutral-400 block -mt-1 font-medium">Historical Football Draft Simulator</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>v2.0 FUT Draft Edition</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Hero Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Spin Legendary Eras · Build Your All-Time XI</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-100 leading-tight">
            Build Your All-Time XI. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
              Conquer The Season.
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-neutral-400 leading-relaxed">
            Spin historical squads from legendary eras (The Invincibles &apos;04, Treble Winners &apos;99, Centurions &apos;18, Chelsea &apos;05, Liverpool &apos;20). Pick any player, target your tactical slots, and simulate a full 38-game campaign.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 sm:p-8 space-y-8">
          {/* Step 1: League Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-black text-neutral-200 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>1. Select Championship League</span>
              </label>
              <span className="text-xs text-neutral-400 font-mono">20 Clubs · 38 Matchdays</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {leagues.map((l) => {
                const isSelected = leagueCode === l.code;
                return (
                  <button
                    key={l.code}
                    id={`league-button-${l.code}`}
                    type="button"
                    onClick={() => setLeagueCode(l.code)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-500/15 text-neutral-100 shadow-lg ring-2 ring-emerald-400/40"
                        : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <div className="font-black text-sm text-neutral-100">{l.name}</div>
                    <div className="text-[11px] text-neutral-500 mt-1 font-medium">
                      {l.country} · {l.numClubs} Clubs
                    </div>
                  </button>
                );
              })}
            </div>

            {leagueCode !== "PL" && (
              <p className="mt-2.5 text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 p-2.5 rounded-xl">
                Note: Premier League features full curated historic squads (Arsenal &apos;04, Man Utd &apos;99, Man City &apos;18, Liverpool &apos;20, Chelsea &apos;05). Other leagues will use the universal database.
              </p>
            )}
          </div>

          {/* Step 2: Formation Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-black text-neutral-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>2. Choose Tactical Formation</span>
              </label>
              <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {formationCode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {formations.map((f) => {
                const isSelected = formationCode === f.code;
                return (
                  <button
                    key={f.code}
                    id={`formation-button-${f.code}`}
                    type="button"
                    onClick={() => setFormationCode(f.code)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-500/15 text-neutral-100 shadow-lg ring-2 ring-emerald-400/40"
                        : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <div>
                      <div className="font-black text-sm text-neutral-100">{f.code}</div>
                      <div className="text-[11px] text-neutral-500 font-medium">{f.label}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Rules & Difficulty */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-black text-neutral-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>3. Rules & Difficulty</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Difficulty */}
              <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-2.5">
                <div className="text-xs font-bold text-neutral-300">Match Simulation Difficulty</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["easy", "normal", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      id={`diff-btn-${d}`}
                      onClick={() => setDifficulty(d)}
                      className={`py-2 rounded-xl text-xs font-black capitalize transition cursor-pointer active:scale-95 ${
                        difficulty === d
                          ? "bg-emerald-500 text-neutral-950 shadow-md"
                          : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Visibility */}
              <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-2.5">
                <div className="text-xs font-bold text-neutral-300">Card Rating Visibility</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="rating-vis-visible"
                    onClick={() => setRatingVisibility("visible")}
                    className={`py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                      ratingVisibility === "visible"
                        ? "bg-emerald-500 text-neutral-950 shadow-md"
                        : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                    }`}
                  >
                    Visible Ratings
                  </button>
                  <button
                    type="button"
                    id="rating-vis-blind"
                    onClick={() => setRatingVisibility("blind")}
                    className={`py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                      ratingVisibility === "blind"
                        ? "bg-emerald-500 text-neutral-950 shadow-md"
                        : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                    }`}
                  >
                    Blind (Hardcore)
                  </button>
                </div>
              </div>

              {/* Rating Model */}
              <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-2.5 sm:col-span-2">
                <div className="text-xs font-bold text-neutral-300">Rating Model</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="rating-model-career"
                    onClick={() => setRatingModel("career_season")}
                    className={`py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                      ratingModel === "career_season"
                        ? "bg-emerald-500 text-neutral-950 shadow-md"
                        : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                    }`}
                  >
                    Career Season
                  </button>
                  <button
                    type="button"
                    id="rating-model-prime"
                    onClick={() => setRatingModel("prime")}
                    className={`py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                      ratingModel === "prime"
                        ? "bg-emerald-500 text-neutral-950 shadow-md"
                        : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                    }`}
                  >
                    Prime
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  {ratingModel === "prime"
                    ? "Players are rated at their career-peak level instead of this specific season's form."
                    : "Players are rated exactly as they performed in this specific historical season."}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Action CTA */}
          <button
            id="start-draft-button"
            type="button"
            onClick={() => startDraft()}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-base transition shadow-2xl hover:shadow-emerald-500/30 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <Play className="w-5 h-5 fill-neutral-950" />
            <span>{loading ? "Initializing Draft Arena…" : "Enter Draft Arena"}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
