"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Trophy } from "@/components/icons";
import { soundManager } from "@/components/sound/SoundManager";

export interface LeaderboardRow {
  teamId: string;
  teamName: string;
  solved: boolean;
  rank: number | null;
  solvedAt: string | null;
  solvedAtFormatted: string | null;
  attempts: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      soundManager.playClick();
      fetchLeaderboard();
      const interval = setInterval(fetchLeaderboard, 7000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        soundManager.playClick();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Analytics & Top 3 Solver Derivation
  const analytics = useMemo(() => {
    const totalTeams = rows.length;
    const solvedTeams = rows.filter((r) => r.solved).sort((a, b) => (a.rank || 99) - (b.rank || 99));
    const solvedCount = solvedTeams.length;
    const totalAttempts = rows.reduce((acc, r) => acc + (r.attempts || 0), 0);

    const first = solvedTeams[0] || null;
    const second = solvedTeams[1] || null;
    const third = solvedTeams[2] || null;

    // Contender teams if not all 3 slots filled
    const activeContenders = rows
      .filter((r) => !r.solved)
      .sort((a, b) => b.attempts - a.attempts);

    return {
      totalTeams,
      solvedCount,
      totalAttempts,
      podium: [
        {
          rankLabel: "1ST PLACE",
          medal: "🥇",
          badge: "CHAMPION SOLVER",
          team: first,
          contender: !first ? activeContenders[0] : null,
          color: "border-amber-600 bg-amber-500/10 text-amber-950",
          pillColor: "bg-gold text-ink border-ink",
        },
        {
          rankLabel: "2ND PLACE",
          medal: "🥈",
          badge: "RUNNER-UP",
          team: second,
          contender: !second ? (first ? activeContenders[0] : activeContenders[1]) : null,
          color: "border-slate-400 bg-slate-300/15 text-slate-900",
          pillColor: "bg-slate-300 text-ink border-ink",
        },
        {
          rankLabel: "3RD PLACE",
          medal: "🥉",
          badge: "BRONZE FINISHER",
          team: third,
          contender: !third ? (second ? activeContenders[0] : activeContenders[2]) : null,
          color: "border-amber-800 bg-amber-700/10 text-amber-950",
          pillColor: "bg-amber-700 text-paper border-ink",
        },
      ],
      fastestSolve: first?.solvedAtFormatted || null,
    };
  }, [rows]);

  if (!isOpen) return null;

  return (
    <>
      {/* 1. Backdrop Overlay (Shades the main page without centering content) */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs z-50 transition-opacity duration-200 select-none no-print"
        onClick={() => {
          soundManager.playClick();
          onClose();
        }}
        aria-hidden="true"
      />

      {/* 2. Side Drawer (Docked to the RIGHT SIDE of the viewport) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-drawer-title"
        className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl md:max-w-2xl bg-paper border-l-4 border-ink shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out select-text no-print"
      >
        {/* Drawer Header */}
        <div className="bg-cream border-b-3 border-ink px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 select-none flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gold/30 border-2 border-ink flex items-center justify-center text-ink shadow-sm">
              <Trophy size={18} />
            </div>
            <div>
              <h2
                id="leaderboard-drawer-title"
                className="font-display text-lg sm:text-xl uppercase tracking-tight text-crimson font-black leading-none"
              >
                DETECTRIX LEADERBOARD
              </h2>
              <span className="font-mono text-[10px] text-muted tracking-wider uppercase block mt-0.5">
                SIDEBAR SOLVER DOCKET · AUTO-REFRESHES LIVE
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center font-mono font-black text-sm text-ink hover:text-crimson bg-paper hover:bg-cream rounded border-2 border-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            aria-label="Close leaderboard sidebar"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 font-mono text-xs text-ink leading-relaxed">
          {/* Top Analytical Intelligence Strip */}
          <section className="bg-cream/80 border-2 border-ink rounded p-3 shadow-hard-sm">
            <div className="flex items-center justify-between border-b border-ink/15 pb-2 mb-2">
              <span className="font-black text-crimson uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>🔎</span>
                <span>INVESTIGATION ANALYTICS</span>
              </span>
              <span className="text-[10px] text-muted uppercase">
                {analytics.solvedCount === 0
                  ? "PODIUM VACANT · RACE IS LIVE"
                  : analytics.solvedCount < 3
                  ? `${analytics.solvedCount} OF 3 PODIUM SPOTS CLAIMED`
                  : "ALL 3 PODIUM SPOTS CLAIMED"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-paper p-2 rounded border border-ink/30">
                <span className="block text-[10px] text-muted uppercase">ENROLLED</span>
                <span className="font-display text-base font-black text-ink">{analytics.totalTeams}</span>
              </div>
              <div className="bg-paper p-2 rounded border border-ink/30">
                <span className="block text-[10px] text-muted uppercase">SOLVERS</span>
                <span className="font-display text-base font-black text-crimson">{analytics.solvedCount}</span>
              </div>
              <div className="bg-paper p-2 rounded border border-ink/30">
                <span className="block text-[10px] text-muted uppercase">ATTEMPTS</span>
                <span className="font-display text-base font-black text-ink">{analytics.totalAttempts}</span>
              </div>
            </div>
          </section>

          {/* ========================================================
              TOP THREE PODIUM & SPEED ANALYSIS
              Prominently highlights the 1st, 2nd, and 3rd rank teams
              ======================================================== */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm uppercase text-ink font-black tracking-tight flex items-center gap-1.5">
                <span>🏆</span>
                <span>TOP 3 PODIUM INVESTIGATORS</span>
              </h3>
              <span className="text-[10px] text-muted uppercase">Server-Verified Ranks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {analytics.podium.map((pod, idx) => {
                const team = pod.team;
                const isSolved = Boolean(team?.solved);

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded border-2 ${pod.color} flex flex-col justify-between relative shadow-sm`}
                  >
                    <div>
                      {/* Header Badge */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-base">{pod.medal}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${pod.pillColor}`}
                        >
                          {pod.rankLabel}
                        </span>
                      </div>

                      {/* Team Name or Open Slot Notice */}
                      {isSolved && team ? (
                        <>
                          <div className="font-bold text-xs text-ink truncate" title={team.teamName}>
                            {team.teamName}
                          </div>
                          <div className="text-[10px] text-muted font-mono">{team.teamId}</div>
                        </>
                      ) : (
                        <div>
                          <div className="font-bold text-[11px] text-crimson uppercase">
                            SLOT UNCLAIMED
                          </div>
                          <div className="text-[10px] text-muted italic mt-0.5">
                            {pod.contender
                              ? `Active Contender: ${pod.contender.teamName}`
                              : "Crack code to claim"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats Footer */}
                    <div className="mt-3 pt-2 border-t border-ink/15 text-[10px] flex items-center justify-between">
                      {isSolved && team ? (
                        <>
                          <span className="text-success font-black">SOLVED ✓</span>
                          <span className="text-muted truncate ml-1" title={team.solvedAtFormatted || ""}>
                            {team.solvedAtFormatted?.split(" ")[1] || "Done"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-muted">STATUS:</span>
                          <span className="font-bold text-ink">IN PROGRESS</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ========================================================
              FULL REGISTRY OF ALL TEAMS (Full Table)
              ======================================================== */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm uppercase text-ink font-black tracking-tight">
                FULL REGISTRY OF REGISTERED TEAMS
              </h3>
              <span className="text-[10px] text-muted">{rows.length} Total Teams</span>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-cream/50 border-2 border-ink rounded font-mono text-xs text-muted">
                LOADING LIVE LEADERBOARD DATA...
              </div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center bg-cream/50 border-2 border-ink rounded font-mono text-xs text-muted">
                NO REGISTERED TEAMS FOUND.
              </div>
            ) : (
              <div className="border-2 border-ink rounded shadow-hard-sm overflow-hidden bg-paper">
                <div className="overflow-x-auto max-h-[38vh] overflow-y-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-cream border-b-2 border-ink text-ink uppercase sticky top-0 z-10 select-none">
                      <tr>
                        <th className="p-2 w-12 text-center">RANK</th>
                        <th className="p-2">TEAM NAME</th>
                        <th className="p-2">ID</th>
                        <th className="p-2 text-center">STATUS</th>
                        <th className="p-2">TIME</th>
                        <th className="p-2 text-center">TRIES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/15">
                      {rows.map((row) => {
                        const isTop = row.rank === 1;
                        const isPodium = row.rank && row.rank <= 3;

                        return (
                          <tr
                            key={row.teamId}
                            className={`hover:bg-cream/40 transition-colors ${
                              isTop
                                ? "bg-amber-400/10 font-bold"
                                : isPodium
                                ? "bg-amber-100/30"
                                : ""
                            }`}
                          >
                            <td className="p-2 text-center">
                              {row.solved ? (
                                <span
                                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-black text-[10px] border border-ink ${
                                    row.rank === 1
                                      ? "bg-gold text-ink"
                                      : row.rank === 2
                                      ? "bg-slate-300 text-ink"
                                      : row.rank === 3
                                      ? "bg-amber-700 text-paper"
                                      : "bg-crimson text-paper"
                                  }`}
                                >
                                  {row.rank}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="p-2 font-bold text-ink">
                              <span className="truncate block max-w-[140px] sm:max-w-[200px]" title={row.teamName}>
                                {row.teamName}
                              </span>
                            </td>
                            <td className="p-2 text-[10px] text-muted">{row.teamId}</td>
                            <td className="p-2 text-center">
                              {row.solved ? (
                                <span className="px-1.5 py-0.5 bg-success/20 text-success border border-success rounded text-[9px] font-black uppercase whitespace-nowrap">
                                  SOLVED ✓
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-paper border border-ink/30 text-muted rounded text-[9px] font-bold uppercase whitespace-nowrap">
                                  IN PROGRESS
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-[10px] text-ink whitespace-nowrap">
                              {row.solvedAtFormatted ? row.solvedAtFormatted.split(" ")[1] : "—"}
                            </td>
                            <td className="p-2 text-center font-bold text-muted">{row.attempts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Drawer Footer */}
        <div className="bg-cream border-t-2 border-ink px-4 py-2.5 flex items-center justify-between text-[11px] text-muted select-none flex-shrink-0">
          <span>Rankings authoritative via server timestamp</span>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-3 py-1 bg-paper hover:bg-cream border border-ink rounded font-mono font-bold text-ink hover:text-crimson active:translate-y-0.5"
          >
            CLOSE SIDEBAR [ESC]
          </button>
        </div>
      </aside>
    </>
  );
};
