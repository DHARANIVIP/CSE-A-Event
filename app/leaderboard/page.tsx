"use client";

import React, { useState, useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Trophy } from "@/components/icons";

interface LeaderboardRow {
  teamId: string;
  teamName: string;
  solved: boolean;
  rank: number | null;
  solvedAt: string | null;
  solvedAtFormatted: string | null;
  attempts: number;
}

export default function LeaderboardPage() {
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
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="border-b-3 border-ink pb-3 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
            LIVE INVESTIGATION RANKINGS
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-crimson uppercase font-black tracking-tight flex items-center gap-3">
            <Trophy size={32} />
            DETECTRIX LEADERBOARD
          </h1>
        </div>
        <span className="font-mono text-xs text-muted">
          Auto-updates live every 10 seconds
        </span>
      </div>

      <Panel className="space-y-4">
        <p className="font-mono text-xs sm:text-sm text-ink leading-relaxed">
          Teams solve the 10 investigation questions, derive the 10-character access code, and unlock the Mystery Box. Server rankings are determined strictly by authoritative completion timestamp.
        </p>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-muted">
            LOADING LIVE LEADERBOARD DATA...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-muted">
            NO REGISTERED TEAMS FOUND.
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-ink rounded shadow-hard-sm">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-cream border-b-2 border-ink text-ink uppercase">
                <tr>
                  <th className="p-3 w-16 text-center">RANK</th>
                  <th className="p-3">TEAM NAME</th>
                  <th className="p-3">TEAM ID</th>
                  <th className="p-3 text-center">STATUS</th>
                  <th className="p-3">SOLVED TIMESTAMP</th>
                  <th className="p-3 text-center">ATTEMPTS</th>
                </tr>
              </thead>
              <tbody className="divide-y border-ink/20 bg-paper">
                {rows.map((row, index) => {
                  const isTopWinner = row.rank === 1;
                  return (
                    <tr
                      key={row.teamId}
                      className={`hover:bg-cream/40 transition-colors ${
                        isTopWinner ? "bg-amber-500/10 font-bold" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        {row.solved ? (
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black border border-ink text-xs ${
                              isTopWinner
                                ? "bg-gold text-ink"
                                : row.rank === 2
                                ? "bg-slate-300 text-ink"
                                : row.rank === 3
                                ? "bg-amber-700 text-paper"
                                : "bg-crimson text-paper"
                            }`}
                          >
                            #{row.rank}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-ink">
                        {row.teamName}
                        {isTopWinner && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-gold text-ink border border-ink rounded uppercase font-black">
                            WINNER 🏆
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted">{row.teamId}</td>
                      <td className="p-3 text-center">
                        {row.solved ? (
                          <span className="px-2 py-0.5 bg-success/20 text-success border border-success rounded text-[10px] font-black uppercase">
                            SOLVED ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-paper border border-ink/30 text-muted rounded text-[10px] font-bold uppercase">
                            INVESTIGATING
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-ink">
                        {row.solvedAtFormatted || "—"}
                      </td>
                      <td className="p-3 text-center text-muted font-bold">
                        {row.attempts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
