"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
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
      fetchLeaderboard();
      const interval = setInterval(fetchLeaderboard, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DETECTRIX LIVE LEADERBOARD">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-ink/20 pb-2">
          <div className="flex items-center gap-2">
            <Trophy size={24} />
            <span className="font-mono text-xs font-black text-crimson uppercase tracking-wider">
              SERVER RANKINGS & SOLVER REGISTRY
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted">Auto-updates live</span>
        </div>

        <p className="font-mono text-xs text-ink leading-relaxed">
          Teams solve the 10 investigation questions, derive the 10-character code, and unlock the Mystery Box. Rankings are determined by authoritative server timestamp.
        </p>

        {loading ? (
          <div className="p-6 text-center font-mono text-xs text-muted">
            LOADING LIVE LEADERBOARD DATA...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center font-mono text-xs text-muted">
            NO REGISTERED TEAMS FOUND.
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-ink rounded shadow-hard-sm max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-cream border-b-2 border-ink text-ink uppercase sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 w-14 text-center">RANK</th>
                  <th className="p-2.5">TEAM NAME</th>
                  <th className="p-2.5">TEAM ID</th>
                  <th className="p-2.5 text-center">STATUS</th>
                  <th className="p-2.5">SOLVED TIME</th>
                  <th className="p-2.5 text-center">ATTEMPTS</th>
                </tr>
              </thead>
              <tbody className="divide-y border-ink/20 bg-paper">
                {rows.map((row) => {
                  const isTopWinner = row.rank === 1;
                  return (
                    <tr
                      key={row.teamId}
                      className={`hover:bg-cream/40 transition-colors ${
                        isTopWinner ? "bg-amber-500/10 font-bold" : ""
                      }`}
                    >
                      <td className="p-2.5 text-center">
                        {row.solved ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black border border-ink text-[11px] ${
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
                      <td className="p-2.5 font-bold text-ink">
                        {row.teamName}
                        {isTopWinner && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.5 bg-gold text-ink border border-ink rounded uppercase font-black">
                            WINNER 🏆
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-muted">{row.teamId}</td>
                      <td className="p-2.5 text-center">
                        {row.solved ? (
                          <span className="px-2 py-0.5 bg-success/20 text-success border border-success rounded text-[9px] font-black uppercase">
                            SOLVED ✓
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-paper border border-ink/30 text-muted rounded text-[9px] font-bold uppercase">
                            INVESTIGATING
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-ink">
                        {row.solvedAtFormatted || "—"}
                      </td>
                      <td className="p-2.5 text-center text-muted font-bold">
                        {row.attempts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};
