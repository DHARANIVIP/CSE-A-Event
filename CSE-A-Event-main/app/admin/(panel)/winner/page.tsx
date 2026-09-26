"use client";

import React, { useState, useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Confetti } from "@/components/box/Confetti";
import { MysteryChest } from "@/components/box/MysteryChest";

interface WinnerInfo {
  rank: number;
  teamId: string;
  teamName: string;
  members: string[];
  solvedAt: string;
  solvedAtFormatted: string;
}

export default function AdminWinnerPage() {
  const [winner, setWinner] = useState<WinnerInfo | null>(null);
  const [topSolvers, setTopSolvers] = useState<WinnerInfo[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fullscreen Projector Reveal Mode
  const [revealMode, setRevealMode] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const fetchWinner = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/admin/winner");
      if (res.ok) {
        const data = await res.json();
        setWinner(data.winner);
        setTopSolvers(data.topSolvers || []);
      }
    } catch {
      // ignore
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchWinner();
  }, []);

  // Handle Projector Reveal Countdown
  const startReveal = () => {
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

  // Exit projector on ESC
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
    if (topSolvers.length === 0) return;
    const summary = topSolvers
      .map(
        (t) =>
          `Rank #${t.rank}: ${t.teamName} (${t.teamId}) - Solved at ${t.solvedAtFormatted}`
      )
      .join("\n");
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink pb-3">
        <div>
          <h1 className="font-display text-3xl uppercase text-crimson font-black tracking-tight">
            WINNER VERIFICATION & REVEAL
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            Authoritative transactional confirmation of the first team to deduce the code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchWinner} isLoading={isVerifying}>
            RE-VERIFY DATABASE
          </Button>
          <Button variant="primary" size="sm" onClick={startReveal} disabled={!winner}>
            REVEAL WINNER (PROJECTOR)
          </Button>
        </div>
      </div>

      {/* Official Champion Card */}
      {winner ? (
        <Panel className="bg-gold/30 border-4 border-ink shadow-hard-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink pb-3">
            <div>
              <Badge variant="gold" className="text-xs">
                OFFICIALLY CONFIRMED CHAMPION
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl text-ink font-black uppercase tracking-tight mt-1">
                {winner.teamName}
              </h2>
              <span className="font-mono text-xs font-bold text-muted">
                TEAM ID: {winner.teamId}
              </span>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs uppercase font-bold text-muted block">
                SERVER RECORDED TIMESTAMP
              </span>
              <span className="font-mono text-xl font-black text-crimson">
                {winner.solvedAtFormatted}
              </span>
            </div>
          </div>

          {winner.members?.length > 0 && (
            <div className="font-mono text-xs text-ink">
              <strong>TEAM INVESTIGATORS:</strong> {winner.members.join(", ")}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <Button variant="secondary" size="sm" onClick={copySummary}>
              {copied ? "COPIED TO CLIPBOARD!" : "COPY RESULT SUMMARY"}
            </Button>
          </div>
        </Panel>
      ) : (
        <Panel className="text-center py-12 space-y-2">
          <div className="font-display text-2xl uppercase text-muted font-black">
            NO SOLVER HAS CRACKED THE MYSTERY BOX YET
          </div>
          <p className="font-mono text-xs text-muted">
            The database has registered no correct submissions so far.
          </p>
        </Panel>
      )}

      {/* Top 5 Solver Standings */}
      {topSolvers.length > 0 && (
        <Panel className="space-y-4">
          <h2 className="font-display text-xl uppercase text-crimson font-black">
            OFFICIAL TOP 5 SOLVERS
          </h2>
          <Table headers={["RANK", "TEAM IDENTIFIER", "SOLVED AT (IST)", "MEMBERS"]}>
            {topSolvers.map((item) => (
              <TableRow key={item.teamId} isHighlighted={item.rank === 1}>
                <TableCell>
                  <Badge variant={item.rank === 1 ? "gold" : "crimson"}>#{item.rank}</Badge>
                </TableCell>
                <TableCell className="font-bold">
                  <span>{item.teamName}</span>
                  <span className="text-muted text-[10px] block font-mono">{item.teamId}</span>
                </TableCell>
                <TableCell className="font-mono font-bold text-crimson">
                  {item.solvedAtFormatted}
                </TableCell>
                <TableCell className="text-xs">{item.members.join(", ") || "--"}</TableCell>
              </TableRow>
            ))}
          </Table>
        </Panel>
      )}

      {/* Fullscreen Projector Winner Reveal Modal */}
      {revealMode && (
        <div className="fixed inset-0 z-50 bg-[#FFF4E0] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          <button
            onClick={() => setRevealMode(false)}
            className="absolute top-6 right-6 px-3 py-1.5 bg-paper border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard"
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

          {revealed && winner && (
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <Confetti durationMs={6000} />

              <div className="flex justify-center">
                <MysteryChest state="open" />
              </div>

              <div className="space-y-2">
                <span className="px-4 py-1.5 bg-gold text-ink font-mono font-black text-sm rounded border-3 border-ink shadow-hard uppercase tracking-widest">
                  ★ OFFICIAL CHAMPION ★
                </span>
                <h1 className="font-display text-5xl sm:text-7xl text-crimson font-black uppercase tracking-tight drop-shadow-[4px_4px_0px_#1EB0D8] mt-2">
                  {winner.teamName}
                </h1>
                <p className="font-mono text-xl text-ink font-bold">
                  TEAM #{winner.teamId}
                </p>
                <div className="font-mono text-base font-black text-crimson bg-paper inline-block px-4 py-1.5 rounded border-2 border-ink shadow-sm">
                  OFFICIAL TIME: {winner.solvedAtFormatted}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
