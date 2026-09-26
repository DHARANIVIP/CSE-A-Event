"use client";

import React, { useState, useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Confetti } from "@/components/box/Confetti";
import { MysteryChest } from "@/components/box/MysteryChest";
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

interface TeamDetail {
  id: string;
  name: string;
  members: string[];
}

export default function AdminLeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [teamsMap, setTeamsMap] = useState<Map<string, TeamDetail>>(new Map());
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fullscreen Projector Reveal Mode
  const [revealMode, setRevealMode] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const fetchData = async () => {
    try {
      const [lbRes, teamsRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/admin/teams"),
      ]);

      if (lbRes.ok && teamsRes.ok) {
        const lbData = await lbRes.json();
        const teamsData = await teamsRes.json();

        const map = new Map<string, TeamDetail>();
        for (const t of teamsData.teams || []) {
          map.set(t.id, t);
        }

        setRows(lbData.rows || []);
        setTeamsMap(map);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const winnerRow = rows.find((r) => r.rank === 1);
  const winnerTeam = winnerRow ? teamsMap.get(winnerRow.teamId) : null;

  // Projector countdown
  const startReveal = () => {
    if (!winnerRow) return;
    setRevealMode(true);
    setRevealed(false);
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        setRevealed(true);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && revealMode) {
        setRevealMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [revealMode]);

  const copySummary = () => {
    const solvedRows = rows.filter((r) => r.solved);
    if (solvedRows.length === 0) return;

    const summary = solvedRows
      .map((r) => {
        const t = teamsMap.get(r.teamId);
        const membersStr = t?.members?.length ? ` [${t.members.join(", ")}]` : "";
        return `Rank #${r.rank}: ${r.teamName} (${r.teamId})${membersStr} - Solved: ${r.solvedAtFormatted} (${r.attempts} attempts)`;
      })
      .join("\n");

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const topSolvers = rows.filter((r) => r.solved).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink pb-3">
        <div>
          <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
            OFFICIAL SCORING DESK
          </span>
          <h1 className="font-display text-3xl uppercase text-crimson font-black tracking-tight flex items-center gap-2">
            <Trophy size={28} />
            LIVE DETECTIVE LEADERBOARD
          </h1>
          <p className="font-mono text-xs text-muted mt-0.5">
            Authoritative completion rankings verified by PostgreSQL timestamping.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchData}>
            REFRESH STANDINGS
          </Button>
          <Button variant="secondary" size="sm" onClick={copySummary} disabled={topSolvers.length === 0}>
            {copied ? "✓ COPIED!" : "COPY SUMMARY"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={startReveal}
            disabled={!winnerRow}
            id="btn-admin-projector-reveal"
          >
            ★ REVEAL WINNER (PROJECTOR)
          </Button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      {topSolvers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topSolvers.map((item) => {
            const team = teamsMap.get(item.teamId);
            const isFirst = item.rank === 1;
            return (
              <Panel
                key={item.teamId}
                className={`space-y-2 border-3 ${
                  isFirst
                    ? "bg-amber-100/60 border-brass shadow-hard"
                    : item.rank === 2
                    ? "bg-stone-100/60 border-stone-400 shadow-hard-sm"
                    : "bg-amber-900/10 border-amber-800 shadow-hard-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-mono font-black text-xs border border-ink shadow-sm ${
                      isFirst
                        ? "bg-gold text-ink"
                        : item.rank === 2
                        ? "bg-slate-300 text-ink"
                        : "bg-amber-700 text-paper"
                    }`}
                  >
                    #{item.rank}
                  </span>
                  <Badge variant={isFirst ? "gold" : "crimson"} className="text-[10px]">
                    {isFirst ? "CHAMPION 🏆" : `RUNNER UP #${item.rank}`}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-display text-xl uppercase text-ink font-black tracking-tight">
                    {item.teamName}
                  </h3>
                  <span className="font-mono text-xs text-muted font-bold block">
                    {item.teamId}
                  </span>
                </div>

                {team?.members && team.members.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {team.members.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-paper border border-ink/30 rounded font-mono text-[10px] text-ink font-bold"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-ink/15 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted">SOLVED AT:</span>
                  <strong className="text-crimson font-black">
                    {item.solvedAtFormatted || "--"}
                  </strong>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* Main Full Leaderboard Table */}
      <Panel className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2">
          <div>
            <h2 className="font-display text-xl uppercase text-crimson font-black">
              PARTICIPANT RANKING ROSTER ({rows.length} TEAMS)
            </h2>
            <span className="font-mono text-xs text-muted">
              Rankings automatically serialize upon every correct mystery box submission.
            </span>
          </div>

          <span className="font-mono text-xs px-2.5 py-1 bg-cream border border-ink rounded font-bold">
            SOLVED: {rows.filter((r) => r.solved).length} / {rows.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-muted">
            SYNCHRONIZING SERVER STANDINGS...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-muted">
            NO TEAMS REGISTERED IN SYSTEM YET.
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-ink rounded shadow-hard-sm">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-cream border-b-2 border-ink text-ink uppercase">
                <tr>
                  <th className="p-3 w-16 text-center">RANK</th>
                  <th className="p-3">TEAM IDENTIFIER</th>
                  <th className="p-3">REGISTERED STUDENTS</th>
                  <th className="p-3 text-center">STATUS</th>
                  <th className="p-3">SOLVED TIME (IST)</th>
                  <th className="p-3 text-center">ATTEMPTS</th>
                </tr>
              </thead>
              <tbody className="divide-y border-ink/20 bg-paper">
                {rows.map((row) => {
                  const isTopWinner = row.rank === 1;
                  const team = teamsMap.get(row.teamId);

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
                      <td className="p-3">
                        <span className="font-bold text-ink block">{row.teamName}</span>
                        <span className="text-[11px] text-muted">{row.teamId}</span>
                      </td>
                      <td className="p-3">
                        {team?.members && team.members.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {team.members.map((member, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-cream border border-ink/30 rounded text-[10px] font-bold text-ink"
                              >
                                {member}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
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
                      <td className="p-3 font-mono font-bold text-crimson">
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

      {/* Fullscreen Projector Winner Reveal Modal */}
      {revealMode && (
        <div className="fixed inset-0 z-50 bg-[#FFF4E0] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          <button
            onClick={() => setRevealMode(false)}
            className="absolute top-6 right-6 px-4 py-2 bg-paper border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard hover:bg-cream"
          >
            ESC TO EXIT
          </button>

          {countdown !== null && (
            <div className="space-y-4 animate-bounce">
              <span className="font-mono text-xl sm:text-2xl font-black text-crimson uppercase tracking-widest block">
                ANNOUNCING THE WINNING INVESTIGATORS IN...
              </span>
              <div className="font-display text-9xl text-ink font-black">{countdown}</div>
            </div>
          )}

          {revealed && winnerRow && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <Confetti durationMs={8000} />

              <div className="flex justify-center">
                <MysteryChest state="open" />
              </div>

              <div className="space-y-3">
                <span className="px-5 py-2 bg-gold text-ink font-mono font-black text-sm rounded border-3 border-ink shadow-hard uppercase tracking-widest inline-block">
                  ★ OFFICIAL CHAMPION ★
                </span>
                <h1 className="font-display text-5xl sm:text-7xl text-crimson font-black uppercase tracking-tight drop-shadow-[4px_4px_0px_#1EB0D8] mt-2">
                  {winnerRow.teamName}
                </h1>
                <p className="font-mono text-xl text-ink font-bold">
                  TEAM #{winnerRow.teamId}
                </p>

                {winnerTeam?.members && winnerTeam.members.length > 0 && (
                  <div className="font-mono text-base text-ink font-bold pt-1">
                    INVESTIGATORS: {winnerTeam.members.join(" • ")}
                  </div>
                )}

                <div className="font-mono text-base font-black text-crimson bg-paper inline-block px-5 py-2 rounded border-2 border-ink shadow-sm mt-2">
                  OFFICIAL SOLVE TIME: {winnerRow.solvedAtFormatted}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
