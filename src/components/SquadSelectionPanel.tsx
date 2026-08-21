"use client";

import React, { useState, useMemo } from "react";
import { RefreshCw, Check, Sparkles, User, Search, Shield, Zap } from "lucide-react";
import type { PitchSlot } from "./TacticalPitch";

export interface SquadPlayer {
  id: number;
  fullName?: string;
  primaryPosition: string;
  secondaryPositions: string; // JSON string or array
  overall: number;
  performanceTier: string;
  goals: number;
  assists: number;
  appearances: number;
  nationality?: string;
  tacticalTags?: string;
  achievements?: string;
}

interface SquadSelectionPanelProps {
  club: { name: string; shortName: string; colorPrimary: string };
  clubSeason: { seasonLabel: string; notes: string };
  squad: SquadPlayer[];
  slots: PitchSlot[];
  selectedSlotId: number | null;
  onSelectSlot: (slotId: number) => void;
  selectedPlayerId: number | null;
  onSelectPlayer: (player: SquadPlayer | null) => void;
  onConfirmSelection: (playerSeasonId: number, targetSlotId: number) => void;
  onReroll: (type: "club" | "era" | "full") => void;
  rerolls: {
    club: number;
    era: number;
    full: number;
  };
  busy: boolean;
  ratingVisibility?: string;
}

function parseSecondaryPositions(val: string | unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function SquadSelectionPanel({
  club,
  clubSeason,
  squad,
  slots,
  selectedSlotId,
  onSelectSlot,
  selectedPlayerId,
  onSelectPlayer,
  onConfirmSelection,
  onReroll,
  rerolls,
  busy,
  ratingVisibility = "visible",
}: SquadSelectionPanelProps) {
  const [filter, setFilter] = useState<"ALL" | "ATT" | "MID" | "DEF" | "GK">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Find currently selected player object
  const selectedPlayer = useMemo(() => {
    return squad.find((p) => p.id === selectedPlayerId) || null;
  }, [squad, selectedPlayerId]);

  // Unfilled slots available for selection
  const emptySlots = useMemo(() => {
    return slots.filter((s) => !s.selection);
  }, [slots]);

  // If no slot is manually selected, or selected slot is already filled, pick first empty slot
  const currentTargetSlot = useMemo(() => {
    const matched = slots.find((s) => s.id === selectedSlotId && !s.selection);
    return matched || emptySlots[0] || null;
  }, [slots, selectedSlotId, emptySlots]);

  // Filter squad players by role and search query
  const filteredSquad = useMemo(() => {
    return squad.filter((p) => {
      // Role filter
      if (filter === "GK" && p.primaryPosition !== "GK") return false;
      if (filter === "DEF" && !["LB", "CB", "RB", "LWB", "RWB"].includes(p.primaryPosition)) return false;
      if (filter === "MID" && !["CDM", "CM", "CAM", "LM", "RM"].includes(p.primaryPosition)) return false;
      if (filter === "ATT" && !["LW", "RW", "ST", "CF"].includes(p.primaryPosition)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = (p.fullName || "").toLowerCase().includes(query);
        const posMatch = p.primaryPosition.toLowerCase().includes(query);
        const natMatch = (p.nationality || "").toLowerCase().includes(query);
        if (!nameMatch && !posMatch && !natMatch) return false;
      }

      return true;
    });
  }, [squad, filter, searchQuery]);

  // Calculate fit score for a player in a specific slot
  function getFitInfo(player: SquadPlayer, slotRole: string) {
    const secondaries = parseSecondaryPositions(player.secondaryPositions);

    if (player.primaryPosition === slotRole) {
      return { score: 100, label: "Natural Role", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" };
    }
    if (secondaries.includes(slotRole)) {
      return { score: 85, label: "Secondary Role", color: "text-amber-400 bg-amber-500/15 border-amber-500/30" };
    }
    return { score: 50, label: "Out of Position", color: "text-rose-400 bg-rose-500/15 border-rose-500/30" };
  }

  const currentFit =
    selectedPlayer && currentTargetSlot
      ? getFitInfo(selectedPlayer, currentTargetSlot.primaryRole)
      : null;

  return (
    <div id="squad-selection-panel" className="w-full flex flex-col rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
      {/* Historical Club Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg border border-white/20"
            style={{ backgroundColor: club.colorPrimary || "#059669" }}
          >
            {club.shortName || club.name.slice(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-neutral-100 tracking-tight">{club.name}</h2>
              <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-xs font-mono font-bold text-neutral-200 border border-neutral-700">
                {clubSeason.seasonLabel}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{clubSeason.notes}</p>
          </div>
        </div>

        {/* Reroll Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="reroll-club-button"
            onClick={(e) => {
              e.preventDefault();
              if (!busy && rerolls.club > 0) onReroll("club");
            }}
            disabled={busy || rerolls.club <= 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            title="Respin a different club from the same era"
          >
            <RefreshCw className={`w-3 h-3 ${busy ? "animate-spin" : ""}`} />
            <span>Club ({rerolls.club})</span>
          </button>

          <button
            type="button"
            id="reroll-era-button"
            onClick={(e) => {
              e.preventDefault();
              if (!busy && rerolls.era > 0) onReroll("era");
            }}
            disabled={busy || rerolls.era <= 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            title="Respin from another historic decade"
          >
            <RefreshCw className={`w-3 h-3 ${busy ? "animate-spin" : ""}`} />
            <span>Era ({rerolls.era})</span>
          </button>

          <button
            type="button"
            id="reroll-full-button"
            onClick={(e) => {
              e.preventDefault();
              if (!busy && rerolls.full > 0) onReroll("full");
            }}
            disabled={busy || rerolls.full <= 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            title="Full random respin"
          >
            <RefreshCw className={`w-3 h-3 ${busy ? "animate-spin" : ""}`} />
            <span>Full ({rerolls.full})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5">
          {(["ALL", "ATT", "MID", "DEF", "GK"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              id={`filter-tab-${cat}`}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                filter === cat
                  ? "bg-emerald-500 text-neutral-950 shadow-md"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
              }`}
            >
              {cat === "ALL" ? "All Squad" : cat === "ATT" ? "Attackers" : cat === "MID" ? "Midfield" : cat === "DEF" ? "Defenders" : "Goalkeepers"}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative flex items-center min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search player / position…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Player Selection Grid (FUT Cards) */}
      <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto custom-scrollbar">
        {filteredSquad.map((player) => {
          const isSelected = selectedPlayerId === player.id;
          const secondaries = parseSecondaryPositions(player.secondaryPositions);

          // Card Theme based on Overall
          const isGold = player.overall >= 88;
          const isSilver = player.overall >= 84 && player.overall < 88;

          return (
            <div
              key={player.id}
              id={`player-card-${player.id}`}
              onClick={() => onSelectPlayer(isSelected ? null : player)}
              className={`group p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "border-emerald-400 bg-neutral-900 ring-2 ring-emerald-400/50 shadow-xl scale-[1.02]"
                  : isGold
                  ? "border-amber-500/30 bg-gradient-to-br from-neutral-900 via-neutral-950 to-amber-950/20 hover:border-amber-400/60"
                  : isSilver
                  ? "border-emerald-500/30 bg-gradient-to-br from-neutral-900 via-neutral-950 to-emerald-950/20 hover:border-emerald-400/60"
                  : "border-neutral-800 bg-neutral-950/80 hover:border-neutral-700 hover:bg-neutral-900"
              }`}
            >
              {/* Top Row: Info + Rating */}
              <div className="w-full flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-neutral-100 truncate">
                      {player.fullName || `Player #${player.id}`}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-neutral-800 text-neutral-300">
                      {player.performanceTier}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-emerald-400 px-1.5 py-0.2 bg-emerald-500/10 rounded border border-emerald-500/20">
                      {player.primaryPosition}
                    </span>
                    {secondaries.length > 0 && (
                      <span className="text-neutral-500 text-[11px]">
                        Alt: {secondaries.join(", ")}
                      </span>
                    )}
                    <span className="text-neutral-600">·</span>
                    <span className="text-neutral-400 text-[11px]">{player.nationality}</span>
                  </div>
                </div>

                {/* Rating Shield */}
                {ratingVisibility === "visible" ? (
                  <div
                    className={`text-lg font-black font-mono px-2 py-0.5 rounded-xl border shadow-md flex items-center gap-1 ${
                      isGold
                        ? "text-amber-300 bg-amber-500/15 border-amber-500/40"
                        : isSilver
                        ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/40"
                        : "text-sky-300 bg-sky-500/15 border-sky-500/40"
                    }`}
                  >
                    <Shield className="w-3 h-3 text-amber-400/80" />
                    <span>{player.overall}</span>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-neutral-500 px-2 py-1 rounded bg-neutral-800">
                    BLIND
                  </div>
                )}
              </div>

              {/* Match Contribution Stats */}
              <div className="w-full flex items-center justify-between text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800/80">
                <span>Apps: <strong className="text-neutral-200">{player.appearances}</strong></span>
                <span>Goals: <strong className="text-neutral-200">{player.goals}</strong></span>
                <span>Assists: <strong className="text-neutral-200">{player.assists}</strong></span>
              </div>

              {/* Quick Select & Draft Button inside card */}
              <div className="w-full flex items-center justify-between gap-2 pt-1">
                {currentTargetSlot && (
                  <span className="text-[10px] text-neutral-400">
                    Target: <strong className="text-emerald-400">{currentTargetSlot.primaryRole}</strong>
                  </span>
                )}

                <button
                  type="button"
                  id={`draft-btn-${player.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlayer(player);
                    if (currentTargetSlot) {
                      onConfirmSelection(player.id, currentTargetSlot.id);
                    }
                  }}
                  disabled={busy || !currentTargetSlot}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-neutral-950 text-xs font-bold transition flex items-center gap-1 border border-emerald-500/30 cursor-pointer active:scale-95"
                >
                  <Zap className="w-3 h-3" />
                  <span>Draft</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Player Placement & Confirmation Sticky Action Bar */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {selectedPlayer ? (
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-neutral-100">{selectedPlayer.fullName}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">({selectedPlayer.primaryPosition})</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-neutral-400 font-semibold">Target Pitch Slot:</span>
                  <select
                    value={currentTargetSlot?.id || ""}
                    onChange={(e) => onSelectSlot(Number(e.target.value))}
                    className="bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
                  >
                    {emptySlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.primaryRole} (Slot #{s.slotOrder})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {currentFit && (
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${currentFit.color}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentFit.score}% Fit · {currentFit.label}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-neutral-400 flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Select any player above, or click a slot on the tactical pitch to begin assignment.</span>
          </div>
        )}

        {/* Big Confirmation CTA Button */}
        <button
          type="button"
          id="confirm-draft-pick-button"
          disabled={!selectedPlayer || !currentTargetSlot || busy}
          onClick={(e) => {
            e.preventDefault();
            if (selectedPlayer && currentTargetSlot && !busy) {
              onConfirmSelection(selectedPlayer.id, currentTargetSlot.id);
            }
          }}
          className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shrink-0"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>
            {busy
              ? "Locking In Selection…"
              : selectedPlayer && currentTargetSlot
              ? `Place ${selectedPlayer.fullName?.split(" ").pop()} at ${currentTargetSlot.primaryRole}`
              : "Select a Player"}
          </span>
        </button>
      </div>
    </div>
  );
}
