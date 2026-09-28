"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Trophy } from "@/components/icons";
import { soundManager } from "@/components/sound/SoundManager";

export interface LeaderboardRow {
  teamId: string;
  teamName: string;
  leaderName?: string | null;
  solved: boolean;
  boxSolved?: boolean;
  questionsSolved?: number;
  totalQuestions?: number;
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

  const fetchLeaderboard = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (isOpen) {
      soundManager.playClick();
      fetchLeaderboard();
      const interval = setInterval(fetchLeaderboard, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchLeaderboard]);

  // Listen for instant live updates when any question answer is checked or reset
  useEffect(() => {
    const handleUpdate = () => {
      fetchLeaderboard();
    };
    window.addEventListener("leaderboard-update", handleUpdate);
    return () => window.removeEventListener("leaderboard-update", handleUpdate);
  }, [fetchLeaderboard]);

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

  // Analytics & Top 3 Solver Derivation based on questions solved & timestamps
  const analytics = useMemo(() => {
    const totalTeams = rows.length;

    // Ranked teams: either cracked box or solved at least 1 question
    const rankedTeams = rows
      .filter((r) => (r.rank !== null && r.rank > 0) || (r.questionsSolved && r.questionsSolved > 0) || r.solved)
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));

    const totalActiveSolvers = rankedTeams.length;
    const totalAttempts = rows.reduce((acc, r) => acc + (r.attempts || 0), 0);

    const first = rankedTeams[0] || null;
    const second = rankedTeams[1] || null;
    const third = rankedTeams[2] || null;

    // Contender teams if slots are empty
    const unrankedContenders = rows
      .filter((r) => !r.rank)
      .sort((a, b) => b.attempts - a.attempts);

    return {
      totalTeams,
      totalActiveSolvers,
      totalAttempts,
      podium: [
        {
          rankLabel: "1ST PLACE",
          medal: "🥇",
          badge: first?.boxSolved ? "CHAMPION SOLVER" : "CURRENT LEADER",
          team: first,
          contender: !first ? unrankedContenders[0] : null,
          color: "border-amber-600 bg-amber-500/10 text-amber-950",
          pillColor: "bg-gold text-ink border-ink",
        },
        {
          rankLabel: "2ND PLACE",
          medal: "🥈",
          badge: "RUNNER-UP",
          team: second,
          contender: !second ? (first ? unrankedContenders[0] : unrankedContenders[1]) : null,
          color: "border-slate-400 bg-slate-300/15 text-slate-900",
          pillColor: "bg-slate-300 text-ink border-ink",
        },
        {
          rankLabel: "3RD PLACE",
          medal: "🥉",
          badge: "BRONZE FINISHER",
          team: third,
          contender: !third ? (second ? unrankedContenders[0] : unrankedContenders[2]) : null,
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
      {/* 1. Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs z-50 transition-opacity duration-200 select-none no-print"
        onClick={() => {
          soundManager.playClick();
          onClose();
        }}
        aria-hidden="true"
      />

      {/* 2. Side Drawer (Docked to the RIGHT SIDE of the viewport as a slender perpendicular vertical panel) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-drawer-title"
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] md:w-[480px] max-w-full sm:max-w-[480px] bg-paper border-l-4 border-ink shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out select-text no-print"
      >
        {/* Drawer Header */}
        <div className="bg-cream border-b-3 border-ink px-4 py-3 flex items-center justify-between gap-3 select-none flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gold/30 border-2 border-ink flex items-center justify-center text-ink shadow-sm flex-shrink-0">
              <Trophy size={18} />
            </div>
            <div>
              <h2
                id="leaderboard-drawer-title"
                className="font-display text-base sm:text-lg uppercase tracking-tight text-crimson font-black leading-none"
              >
                DETECTRIX LEADERBOARD
              </h2>
              <span className="font-mono text-[9px] sm:text-[10px] text-muted tracking-wider uppercase block mt-0.5">
                LIVE DOCKET · RANKED BY QUESTIONS SOLVED & FIRST-SOLVE TIMESTAMPS
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center font-mono font-black text-sm text-ink hover:text-crimson bg-paper hover:bg-cream rounded border-2 border-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex-shrink-0 cursor-pointer"
            aria-label="Close leaderboard sidebar"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 font-mono text-xs text-ink leading-relaxed">
          {/* Top Analytical Intelligence Strip */}
          <section className="bg-cream/80 border-2 border-ink rounded p-2.5 shadow-hard-sm">
            <div className="flex items-center justify-between border-b border-ink/15 pb-1.5 mb-2">
              <span className="font-black text-crimson uppercase tracking-wider text-[10px] sm:text-[11px] flex items-center gap-1.5">
                <span>🔎</span>
                <span>INVESTIGATION ANALYTICS</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted uppercase">
                {analytics.totalActiveSolvers === 0
                  ? "PODIUM VACANT · RACE IS LIVE"
                  : analytics.totalActiveSolvers < 3
                  ? `${analytics.totalActiveSolvers} OF 3 PODIUM SPOTS CLAIMED`
                  : "ALL 3 PODIUM SPOTS CLAIMED"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-paper p-1.5 rounded border border-ink/30">
                <span className="block text-[9px] sm:text-[10px] text-muted uppercase">ENROLLED</span>
                <span className="font-display text-sm sm:text-base font-black text-ink">{analytics.totalTeams}</span>
              </div>
              <div className="bg-paper p-1.5 rounded border border-ink/30">
                <span className="block text-[9px] sm:text-[10px] text-muted uppercase">ACTIVE SOLVERS</span>
                <span className="font-display text-sm sm:text-base font-black text-crimson">{analytics.totalActiveSolvers}</span>
              </div>
              <div className="bg-paper p-1.5 rounded border border-ink/30">
                <span className="block text-[9px] sm:text-[10px] text-muted uppercase">ATTEMPTS</span>
                <span className="font-display text-sm sm:text-base font-black text-ink">{analytics.totalAttempts}</span>
              </div>
            </div>
          </section>

          {/* ========================================================
              TOP THREE PODIUM & SPEED ANALYSIS
              ======================================================== */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs sm:text-sm uppercase text-ink font-black tracking-tight flex items-center gap-1.5">
                <span>🏆</span>
                <span>TOP 3 PODIUM INVESTIGATORS</span>
              </h3>
              <span className="text-[9px] sm:text-[10px] text-muted uppercase">Fastest Solvers Ranked 1st</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {analytics.podium.map((pod, idx) => {
                const team = pod.team;
                const hasRank = Boolean(team && team.rank);

                return (
                  <div
                    key={idx}
                    className={`p-2 sm:p-2.5 rounded border-2 ${pod.color} flex flex-col justify-between relative shadow-sm`}
                  >
                    <div>
                      {/* Header Badge */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-sm">{pod.medal}</span>
                        <span
                          className={`text-[8px] sm:text-[9px] font-black uppercase px-1 py-0.5 rounded border ${pod.pillColor}`}
                        >
                          {pod.rankLabel}
                        </span>
                      </div>

                      {/* Team Name or Open Slot Notice */}
                      {hasRank && team ? (
                        <>
                          <div className="font-bold text-[11px] text-ink truncate" title={team.teamName}>
                            {team.teamName}
                          </div>
                          <div className="text-[9px] text-muted font-mono">{team.teamId}</div>
                          <div className="mt-0.5 text-[10px] font-bold text-crimson truncate">
                            {team.boxSolved
                              ? "BOX CRACKED"
                              : `${team.questionsSolved || 0}/10 SOLVED`}
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="font-bold text-[10px] text-crimson uppercase">
                            SLOT UNCLAIMED
                          </div>
                          <div className="text-[9px] text-muted italic mt-0.5 truncate" title={pod.contender ? `Contender: ${pod.contender.teamName}` : ""}>
                            {pod.contender
                              ? `${pod.contender.teamName}`
                              : "Solve to claim"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats Footer */}
                    <div className="mt-2 pt-1.5 border-t border-ink/15 text-[9px] flex items-center justify-between">
                      {hasRank && team ? (
                        <>
                          <span className="text-success font-black">
                            {team.boxSolved ? "WON ✓" : "LEAD ✓"}
                          </span>
                          <span className="text-muted truncate ml-1" title={team.solvedAtFormatted || ""}>
                            {team.solvedAtFormatted?.split(" ")[1] || "Active"}
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
              <h3 className="font-display text-xs sm:text-sm uppercase text-ink font-black tracking-tight">
                FULL REGISTRY OF REGISTERED TEAMS
              </h3>
              <span className="text-[10px] text-muted">{rows.length} Total Teams</span>
            </div>

            {loading ? (
              <div className="p-6 text-center bg-cream/50 border-2 border-ink rounded font-mono text-xs text-muted">
                LOADING LIVE LEADERBOARD DATA...
              </div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-center bg-cream/50 border-2 border-ink rounded font-mono text-xs text-muted">
                NO REGISTERED TEAMS FOUND.
              </div>
            ) : (
              <div className="border-2 border-ink rounded shadow-hard-sm overflow-hidden bg-paper">
                <div className="overflow-x-auto max-h-[42vh] overflow-y-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-cream border-b-2 border-ink text-ink uppercase sticky top-0 z-10 select-none">
                      <tr>
                        <th className="px-2 py-1.5 w-12 text-center text-[10px]">RANK</th>
                        <th className="px-2 py-1.5 text-[10px]">TEAM NAME</th>
                        <th className="px-2 py-1.5 text-[10px]">ID</th>
                        <th className="px-2 py-1.5 text-center text-[10px]">SOLVED</th>
                        <th className="px-2 py-1.5 text-center text-[10px]">STATUS</th>
                        <th className="px-2 py-1.5 text-[10px]">TIME</th>
                        <th className="px-2 py-1.5 text-center text-[10px]">TRIES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/15 text-[11px]">
                      {rows.map((row) => {
                        const isTop = row.rank === 1;
                        const isPodium = row.rank && row.rank <= 3;
                        const qSolved = row.questionsSolved || 0;

                        return (
                          <tr
                            key={row.teamId}
                            className={`hover:bg-cream/40 transition-colors ${
                              isTop
                                ? "bg-amber-400/15 font-bold"
                                : isPodium
                                ? "bg-amber-100/30"
                                : ""
                            }`}
                          >
                            <td className="px-2 py-1.5 text-center">
                              {row.rank ? (
                                <span
                                  className={`inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full font-black text-[9px] border border-ink ${
                                    row.rank === 1
                                      ? "bg-gold text-ink"
                                      : row.rank === 2
                                      ? "bg-slate-300 text-ink"
                                      : row.rank === 3
                                      ? "bg-amber-700 text-paper"
                                      : "bg-crimson text-paper"
                                  }`}
                                >
                                  {row.rank === 1 ? `👑 1` : row.rank}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 font-bold text-ink">
                              <span className="truncate block max-w-[110px] sm:max-w-[130px]" title={row.teamName}>
                                {row.teamName}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-[9px] text-muted">{row.teamId}</td>
                            <td className="px-2 py-1.5 text-center">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${
                                  qSolved > 0
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-400"
                                    : "bg-cream text-muted border-ink/20"
                                }`}
                              >
                                {qSolved}/10
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              {row.boxSolved ? (
                                <span className="px-1.5 py-0.5 bg-success/20 text-success border border-success rounded text-[8px] font-black uppercase whitespace-nowrap">
                                  CRACKED ✓
                                </span>
                              ) : row.rank === 1 ? (
                                <span className="px-1.5 py-0.5 bg-gold/30 text-ink border border-ink rounded text-[8px] font-black uppercase whitespace-nowrap">
                                  LEAD 👑
                                </span>
                              ) : qSolved > 0 ? (
                                <span className="px-1.5 py-0.5 bg-paper border border-ink text-crimson rounded text-[8px] font-black uppercase whitespace-nowrap">
                                  {qSolved}/10
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-paper border border-ink/30 text-muted rounded text-[8px] font-bold uppercase whitespace-nowrap">
                                  PROGRESS
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-[9px] text-ink whitespace-nowrap">
                              {row.solvedAtFormatted ? row.solvedAtFormatted.split(" ")[1] : "—"}
                            </td>
                            <td className="px-2 py-1.5 text-center font-bold text-muted">{row.attempts}</td>
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
        <div className="bg-cream border-t-2 border-ink px-4 py-2 flex items-center justify-between text-[10px] text-muted select-none flex-shrink-0">
          <span>Rankings live via server timestamp</span>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-2.5 py-1 bg-paper hover:bg-cream border border-ink rounded font-mono font-bold text-ink hover:text-crimson active:translate-y-0.5 cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>
      </aside>
    </>
  );
};
