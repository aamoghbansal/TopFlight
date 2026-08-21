"use client";

import React from "react";
import { Sparkles, UserCheck, Shield, Award } from "lucide-react";

export interface PitchSlot {
  id: number;
  slotOrder: number;
  primaryRole: string;
  selection?: {
    playerSeasonId: number;
    playerSeason: {
      id: number;
      fullName?: string;
      primaryPosition: string;
      secondaryPositions?: string;
      overall: number;
      performanceTier: string;
      goals: number;
      assists: number;
      appearances: number;
      nationality?: string;
      tacticalTags?: string;
    };
    positionalFitScore?: number;
  } | null;
}

interface TacticalPitchProps {
  formationCode: string;
  slots: PitchSlot[];
  selectedSlotId: number | null;
  onSelectSlot: (slotId: number) => void;
  selectedPlayer?: {
    id: number;
    fullName?: string;
    primaryPosition: string;
    secondaryPositions: string[];
    overall: number;
  } | null;
  ratingVisibility?: string;
}

export function TacticalPitch({
  formationCode,
  slots,
  selectedSlotId,
  onSelectSlot,
  selectedPlayer,
  ratingVisibility = "visible",
}: TacticalPitchProps) {
  // Categorize formation slots
  const attackRoles = new Set(["LW", "RW", "ST", "CF"]);
  const midRoles = new Set(["CAM", "LM", "RM", "CM", "CDM"]);
  const defRoles = new Set(["LB", "CB", "RB", "LWB", "RWB"]);

  const sortedSlots = [...slots].sort((a, b) => a.slotOrder - b.slotOrder);

  const attackers = sortedSlots.filter((s) => attackRoles.has(s.primaryRole));
  const midfielders = sortedSlots.filter((s) => midRoles.has(s.primaryRole));
  const defenders = sortedSlots.filter((s) => defRoles.has(s.primaryRole));
  const goalkeepers = sortedSlots.filter((s) => s.primaryRole === "GK");

  const lines = [
    { name: "Attack", slots: attackers },
    { name: "Midfield", slots: midfielders },
    { name: "Defense", slots: defenders },
    { name: "Goalkeeper", slots: goalkeepers },
  ].filter((line) => line.slots.length > 0);

  // Compute live team stats from filled slots
  const filledSlots = slots.filter((s) => s.selection && s.selection.playerSeason);
  const totalSlots = slots.length;
  const filledCount = filledSlots.length;

  const avgOverall =
    filledCount > 0
      ? Math.round(
          filledSlots.reduce((acc, s) => acc + (s.selection?.playerSeason?.overall ?? 75), 0) / filledCount
        )
      : "--";

  // Approximate chemistry rating based on fit scores
  const avgFit =
    filledCount > 0
      ? Math.round(
          (filledSlots.reduce((acc, s) => acc + (s.selection?.positionalFitScore ?? 1), 0) / filledCount) * 100
        )
      : 100;

  return (
    <div id="tactical-pitch-container" className="w-full flex flex-col rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
      {/* Tactical Header */}
      <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs tracking-wider border border-emerald-500/40">
            {formationCode}
          </span>
          <span className="text-xs font-bold text-neutral-200">
            Squad: <span className="text-emerald-400 font-mono">{filledCount}</span> / {totalSlots}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400 text-[11px]">AVG OVR:</span>
            <span className="font-bold text-neutral-100 font-mono">{avgOverall}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400 text-[11px]">CHEM:</span>
            <span className="font-bold text-amber-400 font-mono">{avgFit}%</span>
          </div>
        </div>
      </div>

      {/* Selected Player Helper Notice */}
      {selectedPlayer && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-spin" style={{ animationDuration: "4s" }} />
            <span className="truncate">
              Selected: <strong className="text-amber-200">{selectedPlayer.fullName}</strong> ({selectedPlayer.primaryPosition})
            </span>
          </div>
          <span className="text-[11px] text-amber-400/90 shrink-0 font-semibold underline">
            Tap any empty slot below to place
          </span>
        </div>
      )}

      {/* Football Pitch Stage */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[4/4.6] bg-gradient-to-b from-emerald-950 via-emerald-900/90 to-neutral-950 p-3 sm:p-5 flex flex-col justify-between overflow-hidden select-none">
        {/* Stadium Grass Pattern Stripes */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_28px,rgba(255,255,255,0.06)_28px,rgba(255,255,255,0.06)_56px)]" />

        {/* Pitch Boundary Markings */}
        <div className="absolute inset-3 sm:inset-4 border-2 border-white/20 rounded-xl pointer-events-none" />
        
        {/* Halfway Line & Center Circle */}
        <div className="absolute left-3 right-3 sm:left-4 sm:right-4 top-1/2 -translate-y-1/2 border-t-2 border-white/20 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white/20 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40 pointer-events-none" />

        {/* Top Penalty Box (Opponent End) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3 sm:top-4 w-44 sm:w-56 h-14 sm:h-18 border-b-2 border-x-2 border-white/20 rounded-b-lg pointer-events-none" />
        <div className="absolute left-1/2 -translate-x-1/2 top-3 sm:top-4 w-20 sm:w-28 h-6 sm:h-8 border-b-2 border-x-2 border-white/20 rounded-b-md pointer-events-none" />

        {/* Bottom Penalty Box (Our Goalkeeper End) */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 sm:bottom-4 w-48 sm:w-60 h-16 sm:h-20 border-t-2 border-x-2 border-white/20 rounded-t-lg pointer-events-none" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 sm:bottom-4 w-24 sm:w-32 h-7 sm:h-9 border-t-2 border-x-2 border-white/20 rounded-t-md pointer-events-none" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-10 sm:bottom-12 w-2 h-2 rounded-full bg-white/40 pointer-events-none" />

        {/* Tactical Formation Rows */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between py-1">
          {lines.map((line) => (
            <div
              key={line.name}
              className="w-full flex items-center justify-around gap-1.5 sm:gap-3 px-1 sm:px-3"
            >
              {line.slots.map((slot) => {
                const isFilled = !!(slot.selection && slot.selection.playerSeason);
                const isSelected = selectedSlotId === slot.id;
                const player = slot.selection?.playerSeason;

                let fitLabel = "";
                let fitBg = "";
                if (!isFilled && selectedPlayer) {
                  if (selectedPlayer.primaryPosition === slot.primaryRole) {
                    fitLabel = "100% Fit";
                    fitBg = "bg-emerald-500 text-neutral-950 font-black";
                  } else if (selectedPlayer.secondaryPositions.includes(slot.primaryRole)) {
                    fitLabel = "85% Fit";
                    fitBg = "bg-amber-400 text-neutral-950 font-bold";
                  } else {
                    fitLabel = "50% Fit";
                    fitBg = "bg-rose-500 text-white font-medium";
                  }
                }

                return (
                  <button
                    key={slot.id}
                    id={`slot-button-${slot.id}`}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectSlot(slot.id);
                    }}
                    className={`group relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none ${
                      isFilled
                        ? "w-20 sm:w-28 md:w-32"
                        : "w-16 sm:w-22 md:w-26"
                    }`}
                  >
                    {isFilled && player ? (
                      /* Filled Player Card (FUT Style) */
                      <div
                        className={`w-full rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center border text-center transition-all shadow-xl backdrop-blur-md relative overflow-hidden ${
                          isSelected
                            ? "border-emerald-400 bg-neutral-900 ring-2 ring-emerald-400/60 scale-105"
                            : "border-neutral-700/80 bg-neutral-900/90 hover:border-emerald-500/60 hover:bg-neutral-900"
                        }`}
                      >
                        {/* Glow Gradient on top tier */}
                        {player.overall >= 88 && (
                          <div className="absolute -top-6 -right-6 w-14 h-14 bg-amber-500/20 rounded-full blur-md pointer-events-none" />
                        )}

                        <div className="w-full flex items-center justify-between gap-1 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-black bg-neutral-800 text-emerald-400 border border-neutral-700">
                            {slot.primaryRole}
                          </span>
                          {ratingVisibility === "visible" ? (
                            <span
                              className={`text-xs sm:text-sm font-black font-mono px-1 py-0.2 rounded ${
                                player.overall >= 88
                                  ? "text-amber-400 bg-amber-500/15"
                                  : player.overall >= 84
                                  ? "text-emerald-400 bg-emerald-500/15"
                                  : "text-sky-400 bg-sky-500/15"
                              }`}
                            >
                              {player.overall}
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500 font-mono">???</span>
                          )}
                        </div>

                        <div className="w-full truncate font-bold text-neutral-100 text-[11px] sm:text-xs tracking-tight">
                          {player.fullName || `Player #${player.id}`}
                        </div>

                        <div className="w-full truncate text-[9px] sm:text-[10px] text-neutral-400 mt-0.5">
                          {player.nationality || player.primaryPosition}
                        </div>

                        <div className="mt-1 flex items-center gap-1">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-bold ${
                              (slot.selection?.positionalFitScore ?? 1) >= 0.95
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : (slot.selection?.positionalFitScore ?? 1) >= 0.8
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {Math.round((slot.selection?.positionalFitScore ?? 1) * 100)}% fit
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Empty Slot Marker */
                      <div
                        className={`w-full aspect-[4/3] sm:aspect-[4/3.2] rounded-xl flex flex-col items-center justify-center p-1 sm:p-2 border-2 transition-all relative ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105 border-solid ring-2 ring-emerald-400/40"
                            : selectedPlayer
                            ? "border-dashed border-amber-400/80 bg-neutral-950/60 hover:border-amber-300 hover:bg-amber-500/15 hover:scale-105"
                            : "border-dashed border-white/40 bg-neutral-950/50 hover:border-white/80 hover:bg-neutral-950/80"
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black font-mono text-neutral-100 tracking-wider">
                          {slot.primaryRole}
                        </span>

                        {fitLabel ? (
                          <span className={`mt-1 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] tracking-tight ${fitBg} shadow-sm`}>
                            {fitLabel}
                          </span>
                        ) : (
                          <span className="mt-0.5 text-[9px] sm:text-[10px] text-neutral-400 font-semibold">
                            {isSelected ? "Targeted" : "Tap to pick"}
                          </span>
                        )}

                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full flex items-center justify-center text-neutral-950">
                            <UserCheck className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
