"use client";

import React, { useState, useEffect, useRef } from "react";
import { Panel } from "@/components/ui/Panel";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
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
  const [lastEtag, setLastEtag] = useState<string | null>(null);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [serverTime, setServerTime] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeaderboard = async (etag: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (etag) headers["If-None-Match"] = etag;

      const res = await fetch("/api/leaderboard", { headers });
      if (res.status === 304) return;

      if (res.ok) {
        const newEtag = res.headers.get("ETag");
        if (newEtag) setLastEtag(newEtag);

        const data = await res.json();
        setRows(data.rows);
        setServerTime(new Date(data.serverNow).toLocaleTimeString());
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLeaderboard(null);

    // Poll every 10 seconds, pausing on hidden tab (Section 8.7)
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchLeaderboard(lastEtag);
      }
    }, 10000);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchLeaderboard(lastEtag);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [lastEtag]);

  return (
    <div
      className={`space-y-6 max-w-4xl mx-auto py-2 transition-all ${
        isProjectorMode
          ? "fixed inset-0 z-50 bg-paper p-6 sm:p-10 overflow-y-auto max-w-none"
          : ""
      }`}
    >
      {/* Leaderboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-ink pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cream rounded border-2 border-ink shadow-hard-sm">
            <Trophy size={32} />
          </div>
          <div>
            <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
              OFFICIAL EVENT STANDINGS
            </span>
            <h1
              className={`font-display uppercase text-crimson font-black tracking-tight ${
                isProjectorMode ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
              }`}
            >
              LIVE LEADERBOARD
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProjectorMode(!isProjectorMode)}
            className="px-3 py-1.5 bg-cream border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard-sm hover:shadow-hard active:translate-y-0.5"
          >
            {isProjectorMode ? "EXIT PROJECTOR" : "PROJECTOR MODE"}
          </button>
          <span className="font-mono text-xs text-muted">
            SYNC: {serverTime || "ACTIVE"}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <Panel className={isProjectorMode ? "border-4 shadow-hard-lg" : ""}>
        <Table headers={["RANK", "TEAM IDENTIFIER", "SOLVED AT (SERVER TIME)", "ATTEMPTS"]}>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell className="text-center py-8 text-muted" colSpan={4}>
                LOADING OFFICIAL EVENT ROSTER...
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const isFirst = row.rank === 1;
              return (
                <TableRow
                  key={row.teamId}
                  isHighlighted={isFirst}
                  className={!row.solved ? "opacity-60" : ""}
                >
                  {/* Rank Cell */}
                  <TableCell>
                    {isFirst ? (
                      <Badge variant="gold" className="animate-pulse">
                        ★ #1 FIRST
                      </Badge>
                    ) : row.rank ? (
                      <Badge variant="crimson">#{row.rank}</Badge>
                    ) : (
                      <span className="text-muted font-mono font-bold">--</span>
                    )}
                  </TableCell>

                  {/* Team Name */}
                  <TableCell className="font-bold">
                    <span className="text-ink">{row.teamName}</span>
                    <span className="text-muted text-[10px] block font-mono">
                      ID: {row.teamId}
                    </span>
                  </TableCell>

                  {/* Solved At Server Timestamp */}
                  <TableCell>
                    {row.solvedAtFormatted ? (
                      <span className="font-mono font-black text-crimson">
                        {row.solvedAtFormatted}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted italic">
                        Investigating...
                      </span>
                    )}
                  </TableCell>

                  {/* Attempts Count */}
                  <TableCell>
                    <span className="font-mono font-bold text-ink">
                      {row.attempts}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </Table>
      </Panel>

      <div className="font-mono text-xs text-muted text-center">
        Rankings are transactionally serialized by server timestamp. Team members are hidden for competitive integrity.
      </div>
    </div>
  );
}
