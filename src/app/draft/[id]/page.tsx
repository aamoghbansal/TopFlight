"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Info,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Home,
  Shield,
} from "lucide-react";
import { TacticalPitch, type PitchSlot } from "@/components/TacticalPitch";
import { SquadSelectionPanel, type SquadPlayer } from "@/components/SquadSelectionPanel";

interface PlayerSeason {
  id: number;
  fullName?: string;
  primaryPosition: string;
  secondaryPositions: string;
  overall: number;
  performanceTier: string;
  goals: number;
  assists: number;
  appearances: number;
  nationality?: string;
  tacticalTags?: string;
  achievements?: string;
}

interface DraftState {
  draft: {
    id: number;
    status: string;
    ratingVisibility: string;
    rerollsClubRemaining: number;
    rerollsEraRemaining: number;
    rerollsFullRemaining: number;
  };
  league: { name: string; matchesPerClub: number };
  formation: { code: string; label: string };
  slots: { id: number; slotOrder: number; primaryRole: string }[];
  rounds: {
    id: number;
    roundNumber: number;
    formationSlotId: number;
    clubSeasonId: number | null;
    status: string;
    selection: {
      playerSeasonId: number;
      playerSeason: PlayerSeason;
      positionalFitScore?: number;
    } | null;
  }[];
  isComplete: boolean;
}

interface SpinResult {
  club: { name: string; shortName: string; colorPrimary: string };
  clubSeason: { seasonLabel: string; notes: string };
  squad: SquadPlayer[];
  slot: { primaryRole: string };
}

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const [state, setState] = useState<DraftState | null>(null);
  const [spin, setSpin] = useState<SpinResult | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SquadPlayer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch(`/api/drafts/${draftId}`);
      const data = await res.json();
      if (res.ok) {
        setState(data);
        if (data.isComplete) {
          router.push(`/result/${draftId}`);
        }
      }
    } catch {
      // ignore
    }
  }, [draftId, router]);

  useEffect(() => {
    let active = true;
    fetch(`/api/drafts/${draftId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setState(data);
        if (data.isComplete) {
          router.push(`/result/${draftId}`);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [draftId, router]);

  // Combine slots with round selections
  const pitchSlots: PitchSlot[] = useMemo(() => {
    if (!state) return [];
    return state.slots.map((slot) => {
      const roundWithSlot = state.rounds.find(
        (r) => r.formationSlotId === slot.id && r.status === "resolved" && r.selection
      );
      return {
        id: slot.id,
        slotOrder: slot.slotOrder,
        primaryRole: slot.primaryRole,
        selection: roundWithSlot?.selection || null,
      };
    });
  }, [state]);

  const currentRound = state?.rounds.find((r) => r.status === "pending");

  // Effective selected slot: either currently set if empty, or first empty slot
  const effectiveSelectedSlotId = useMemo(() => {
    if (pitchSlots.length === 0) return null;
    const isCurrentValid = pitchSlots.some(
      (s) => s.id === selectedSlotId && !s.selection
    );
    if (isCurrentValid) return selectedSlotId;
    const firstEmpty = pitchSlots.find((s) => !s.selection);
    return firstEmpty ? firstEmpty.id : null;
  }, [pitchSlots, selectedSlotId]);

  async function doSpin() {
    if (!currentRound || busy) return;
    setBusy(true);
    setError(null);
    setSelectedPlayer(null);
    try {
      const res = await fetch(`/api/drafts/${draftId}/spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundNumber: currentRound.roundNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to spin club");
      setSpin(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spin failed");
    } finally {
      setBusy(false);
    }
  }

  async function doReroll(type: "club" | "era" | "full") {
    if (!currentRound || busy) return;
    setBusy(true);
    setError(null);
    setSelectedPlayer(null);
    try {
      const res = await fetch(`/api/drafts/${draftId}/reroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundNumber: currentRound.roundNumber, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reroll failed");
      setSpin(data);
      await loadState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reroll failed");
    } finally {
      setBusy(false);
    }
  }

  async function doSelect(playerSeasonId: number, targetSlotId: number) {
    if (!currentRound || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/drafts/${draftId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundNumber: currentRound.roundNumber,
          playerSeasonId,
          targetSlotId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Selection failed");

      setSpin(null);
      setSelectedPlayer(null);
      await loadState();

      if (data.draftComplete) {
        const finalizeRes = await fetch(`/api/drafts/${draftId}/finalize`, { method: "POST" });
        const finalizeData = await finalizeRes.json();
        if (!finalizeRes.ok) throw new Error(finalizeData.error || "Finalization failed");
        router.push(`/result/${draftId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Selection failed");
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-400">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="font-bold text-neutral-200 text-sm">Loading Draft Arena…</p>
      </main>
    );
  }

  const totalRounds = state.rounds.length;
  const resolvedCount = state.rounds.filter((r) => r.status === "resolved").length;
  const progressPct = Math.round((resolvedCount / totalRounds) * 100);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-16">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-neutral-950 font-black text-lg shadow-md">
              ⚡
            </div>
            <div>
              <span className="font-black text-base text-neutral-100 tracking-tight block">
                TopFlight XI
              </span>
              <span className="text-[11px] text-neutral-400 block -mt-0.5 font-medium">
                {state.league.name} · {state.formation.label}
              </span>
            </div>
          </Link>
        </div>

        {/* Round Progress Bar */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-neutral-300">
              Pick {Math.min(resolvedCount + 1, totalRounds)} of {totalRounds}
            </span>
            <div className="w-32 sm:w-48 h-2.5 rounded-full bg-neutral-800 mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg">
            {progressPct}%
          </span>

          <Link
            href="/"
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
            title="Exit Draft"
          >
            <Home className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:text-rose-200 underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tactical Pitch Column (Left) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <TacticalPitch
              formationCode={state.formation.code}
              slots={pitchSlots}
              selectedSlotId={effectiveSelectedSlotId}
              onSelectSlot={(slotId) => {
                setSelectedSlotId(slotId);
              }}
              selectedPlayer={
                selectedPlayer
                  ? {
                      id: selectedPlayer.id,
                      fullName: selectedPlayer.fullName,
                      primaryPosition: selectedPlayer.primaryPosition,
                      secondaryPositions:
                        typeof selectedPlayer.secondaryPositions === "string"
                          ? JSON.parse(selectedPlayer.secondaryPositions || "[]")
                          : (selectedPlayer.secondaryPositions as unknown as string[]) || [],
                      overall: selectedPlayer.overall,
                    }
                  : null
              }
              ratingVisibility={state.draft.ratingVisibility}
            />

            {/* Tactical Pro Tip */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-400 flex items-start gap-3 shadow-md">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Tactical Versatility:</strong> You can place players into any unfilled slot on the pitch! Click any slot on the pitch to target it, or choose a player to see their positional fit.
              </span>
            </div>
          </div>

          {/* Squad Draw & Selection Column (Right) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {currentRound && !spin && (
              /* Spin Card */
              <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 shadow-xl shadow-emerald-500/10">
                  <Sparkles className="w-10 h-10 animate-pulse" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                    Round {currentRound.roundNumber} of {totalRounds}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-neutral-100 tracking-tight">
                  Spin for a Historic Squad
                </h2>
                <p className="mt-2 text-sm text-neutral-400 max-w-md leading-relaxed">
                  Draw an iconic squad from Premier League history. You can draft any player and assign them to your tactical XI.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    id="spin-historical-squad-button"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      doSpin();
                    }}
                    disabled={busy}
                    className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-base transition shadow-xl hover:shadow-emerald-500/30 flex items-center gap-3 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <RefreshCw className={`w-5 h-5 ${busy ? "animate-spin" : ""}`} />
                    <span>{busy ? "Spinning Reel…" : "Spin Historical Squad"}</span>
                  </button>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400 bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-800">
                  <span className="text-neutral-500 font-semibold">Available Rerolls:</span>
                  <span className="font-bold text-neutral-200">
                    Club ({state.draft.rerollsClubRemaining})
                  </span>
                  <span>·</span>
                  <span className="font-bold text-neutral-200">
                    Era ({state.draft.rerollsEraRemaining})
                  </span>
                  <span>·</span>
                  <span className="font-bold text-neutral-200">
                    Full ({state.draft.rerollsFullRemaining})
                  </span>
                </div>
              </div>
            )}

            {currentRound && spin && (
              /* Squad Selection Panel */
              <SquadSelectionPanel
                club={spin.club}
                clubSeason={spin.clubSeason}
                squad={spin.squad}
                slots={pitchSlots}
                selectedSlotId={effectiveSelectedSlotId}
                onSelectSlot={(slotId) => setSelectedSlotId(slotId)}
                selectedPlayerId={selectedPlayer?.id || null}
                onSelectPlayer={(player) => setSelectedPlayer(player)}
                onConfirmSelection={(playerSeasonId, targetSlotId) =>
                  doSelect(playerSeasonId, targetSlotId)
                }
                onReroll={doReroll}
                rerolls={{
                  club: state.draft.rerollsClubRemaining,
                  era: state.draft.rerollsEraRemaining,
                  full: state.draft.rerollsFullRemaining,
                }}
                busy={busy}
                ratingVisibility={state.draft.ratingVisibility}
              />
            )}

            {!currentRound && (
              <div className="p-12 rounded-3xl bg-neutral-900 border border-neutral-800 text-center flex flex-col items-center justify-center shadow-2xl">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-4 animate-bounce" />
                <h3 className="text-2xl font-black text-neutral-100">Tactical Squad Complete!</h3>
                <p className="text-sm text-neutral-400 mt-2 mb-8 max-w-md">
                  All 11 positions have been drafted. Ready to simulate the 38-matchday campaign!
                </p>
                <Link
                  href={`/result/${draftId}`}
                  className="px-8 py-4 rounded-2xl bg-emerald-500 text-neutral-950 font-black text-base hover:bg-emerald-400 transition shadow-xl hover:shadow-emerald-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Shield className="w-5 h-5" />
                  <span>Simulate Season Now</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
