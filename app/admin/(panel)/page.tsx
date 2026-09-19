"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { formatInIST, formatCountdown } from "@/lib/time";

export default function AdminDashboardPage() {
  const [data, setData] = useState<{
    eventState: {
      start_at: string | null;
      end_at: string | null;
      force_status: string | null;
      case_released: boolean;
    };
    serverNow: string;
  } | null>(null);

  const [stats, setStats] = useState({
    totalTeams: 0,
    solvedTeams: 0,
    totalAttempts: 0,
    wrongAttempts: 0,
    latencyMs: 14,
  });

  const [sparklinePoints, setSparklinePoints] = useState<number[]>([
    2, 5, 8, 14, 22, 18, 25, 34, 40, 32, 28, 45,
  ]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const start = performance.now();
      try {
        const [eventRes, teamsRes, subsRes] = await Promise.all([
          fetch("/api/admin/event"),
          fetch("/api/admin/teams"),
          fetch("/api/admin/submissions"),
        ]);

        const latency = Math.round(performance.now() - start);

        if (eventRes.ok && teamsRes.ok && subsRes.ok) {
          const eventData = await eventRes.json();
          const teamsData = await teamsRes.json();
          const subsData = await subsRes.json();

          const solved = subsData.submissions.filter((s: { isCorrect: boolean }) => s.isCorrect).length;
          const wrong = subsData.submissions.length - solved;

          setData(eventData);
          setStats({
            totalTeams: teamsData.teams.length,
            solvedTeams: solved,
            totalAttempts: subsData.submissions.length,
            wrongAttempts: wrong,
            latencyMs: latency,
          });
        }
      } catch {
        // ignore
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Big Status Card */}
      <Panel className="bg-cream/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-ink/20 pb-3">
          <div>
            <span className="font-mono text-xs font-black text-crimson uppercase tracking-wider block">
              EVENT STATUS
            </span>
            <h1 className="font-display text-3xl text-ink font-black uppercase tracking-tight">
              {data?.eventState.force_status
                ? data.eventState.force_status.toUpperCase()
                : "CONFIGURED"}
            </h1>
          </div>

          <div className="font-mono text-xs text-right space-y-0.5">
            <div>
              START:{" "}
              <span className="font-bold">
                {data?.eventState.start_at
                  ? formatInIST(data.eventState.start_at, { timeOnly: true })
                  : "UNSCHEDULED"}
              </span>
            </div>
            <div>
              DEADLINE:{" "}
              <span className="font-bold">
                {data?.eventState.end_at
                  ? formatInIST(data.eventState.end_at, { timeOnly: true })
                  : "UNSCHEDULED"}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Metric Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-paper border-2 border-ink rounded shadow-hard-sm">
            <span className="font-mono text-[10px] uppercase font-bold text-muted block">
              TOTAL TEAMS
            </span>
            <span className="font-display text-2xl sm:text-3xl text-ink font-black">
              {stats.totalTeams}
            </span>
          </div>

          <div className="p-3 bg-paper border-2 border-ink rounded shadow-hard-sm">
            <span className="font-mono text-[10px] uppercase font-bold text-muted block">
              SOLVED CASES
            </span>
            <span className="font-display text-2xl sm:text-3xl text-success font-black">
              {stats.solvedTeams}
            </span>
          </div>

          <div className="p-3 bg-paper border-2 border-ink rounded shadow-hard-sm">
            <span className="font-mono text-[10px] uppercase font-bold text-muted block">
              TOTAL SUBMISSIONS
            </span>
            <span className="font-display text-2xl sm:text-3xl text-crimson font-black">
              {stats.totalAttempts}
            </span>
          </div>

          <div className="p-3 bg-paper border-2 border-ink rounded shadow-hard-sm">
            <span className="font-mono text-[10px] uppercase font-bold text-muted block">
              DB LATENCY
            </span>
            <span className="font-display text-2xl sm:text-3xl text-ink font-black">
              {stats.latencyMs}ms
            </span>
          </div>
        </div>
      </Panel>

      {/* Attempts Sparkline & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inline SVG Activity Sparkline */}
        <Panel className="space-y-3">
          <span className="font-mono text-xs font-black uppercase text-crimson tracking-wider block">
            ACTIVITY RATE (ATTEMPTS / MINUTE)
          </span>

          <div className="h-32 w-full flex items-end pt-4">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 240 80"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <line x1="0" y1="20" x2="240" y2="20" stroke="#0B0B0B" strokeOpacity="0.1" />
              <line x1="0" y1="50" x2="240" y2="50" stroke="#0B0B0B" strokeOpacity="0.1" />
              <line x1="0" y1="78" x2="240" y2="78" stroke="#0B0B0B" strokeWidth="2" />

              {/* Sparkline Polyline */}
              <polyline
                fill="none"
                stroke="#B30033"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePoints
                  .map((val, idx) => `${(idx * 240) / 11},${80 - val * 1.5}`)
                  .join(" ")}
              />

              {/* Point dots */}
              {sparklinePoints.map((val, idx) => (
                <circle
                  key={idx}
                  cx={(idx * 240) / 11}
                  cy={80 - val * 1.5}
                  r="3.5"
                  fill="#FFF4E0"
                  stroke="#0B0B0B"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>
          <div className="flex justify-between font-mono text-[11px] text-muted">
            <span>T - 15 MIN</span>
            <span>CURRENT MINUTE</span>
          </div>
        </Panel>

        {/* Quick Actions Card */}
        <Panel className="space-y-4">
          <span className="font-mono text-xs font-black uppercase text-crimson tracking-wider block">
            OPERATIONAL COMMANDS
          </span>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/event"
              className="p-3 bg-cream border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard-sm hover:shadow-hard text-center block"
            >
              EVENT CONTROL
            </Link>

            <Link
              href="/admin/teams/print"
              target="_blank"
              className="p-3 bg-cream border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard-sm hover:shadow-hard text-center block"
            >
              PRINT TEAM CARDS
            </Link>

            <Link
              href="/admin/winner"
              className="p-3 bg-gold/50 border-2 border-ink rounded font-mono text-xs font-black uppercase shadow-hard-sm hover:shadow-hard text-center block"
            >
              WINNER REVEAL
            </Link>

            <Link
              href="/admin/submissions"
              className="p-3 bg-cream border-2 border-ink rounded font-mono text-xs font-bold uppercase shadow-hard-sm hover:shadow-hard text-center block"
            >
              SUBMISSION LOG
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
