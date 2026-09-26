"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Trophy, Fingerprint, CaseFolder } from "@/components/icons";
import { formatInIST, formatCountdown } from "@/lib/time";

interface EventStateData {
  start_at: string | null;
  end_at: string | null;
  force_status: string | null;
  case_released: boolean;
  case_sha256: string | null;
}

interface TeamItem {
  id: string;
  name: string;
  members: string[];
  disabled: boolean;
  createdAt: string;
}

interface LeaderboardItem {
  teamId: string;
  teamName: string;
  solved: boolean;
  rank: number | null;
  solvedAtFormatted: string | null;
  attempts: number;
}

export default function AdminDashboardPage() {
  const [eventState, setEventState] = useState<EventStateData | null>(null);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(12);
  const [isUpdating, setIsUpdating] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const fetchDashboardData = async () => {
    const start = performance.now();
    try {
      const [eventRes, teamsRes, lbRes] = await Promise.all([
        fetch("/api/admin/event"),
        fetch("/api/admin/teams"),
        fetch("/api/leaderboard"),
      ]);

      const roundTrip = Math.round(performance.now() - start);
      setLatencyMs(roundTrip);

      if (eventRes.ok && teamsRes.ok && lbRes.ok) {
        const eventData = await eventRes.json();
        const teamsData = await teamsRes.json();
        const lbData = await lbRes.json();

        setEventState(eventData.eventState);
        setTeams(teamsData.teams || []);
        setLeaderboard(lbData.rows || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerEventAction = async (action: string, payload: Record<string, unknown> = {}) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        const data = await res.json();
        setEventState(data.eventState);
      }
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  };

  // Aggregated calculations
  const totalStudents = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  const solvedCount = leaderboard.filter((r) => r.solved).length;
  const totalAttempts = leaderboard.reduce((acc, r) => acc + r.attempts, 0);

  // Search filter for students/teams overview panel
  const filteredTeams = teams
    .filter(
      (t) =>
        t.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
        t.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        t.members.some((m) => m.toLowerCase().includes(studentSearch.toLowerCase()))
    )
    .slice(0, 6);

  const topLeaderboard = leaderboard.slice(0, 5);

  const isLive = eventState?.force_status === "live";
  const isPaused = eventState?.force_status === "paused";
  const isEnded = eventState?.force_status === "ended";

  return (
    <div className="space-y-6">
      {/* 1. Master Event Command Deck (Lifecycle & Questions Visibility) */}
      <Panel className="bg-cream/70 border-3 border-ink space-y-4 shadow-hard">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-ink/20 pb-3">
          <div>
            <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
              DETECTRIX CENTRAL COMMAND DECK
            </span>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  isLive
                    ? "bg-success animate-pulse"
                    : isPaused
                    ? "bg-gold"
                    : isEnded
                    ? "bg-danger"
                    : "bg-ink"
                }`}
              />
              <h1 className="font-display text-2xl sm:text-3xl text-ink font-black uppercase tracking-tight">
                {eventState?.force_status ? eventState.force_status.toUpperCase() : "CONFIGURED"}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 bg-paper border border-ink rounded font-bold text-muted">
                {eventState?.case_released ? "10 QUESTIONS UNLOCKED" : "QUESTIONS LOCKED"}
              </span>
            </div>
          </div>

          {/* Timing details */}
          <div className="font-mono text-xs md:text-right space-y-0.5">
            <div>
              START:{" "}
              <strong className="text-ink">
                {eventState?.start_at
                  ? formatInIST(eventState.start_at, { timeOnly: true })
                  : "NOT STARTED"}
              </strong>
            </div>
            <div>
              DEADLINE:{" "}
              <strong className="text-crimson font-black">
                {eventState?.end_at
                  ? formatInIST(eventState.end_at, { timeOnly: true })
                  : "UNSCHEDULED"}
              </strong>
            </div>
          </div>
        </div>

        {/* Quick Lifecycle Command Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {!isLive ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => triggerEventAction("START_NOW")}
                disabled={isUpdating}
                isLoading={isUpdating}
              >
                START EVENT NOW
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => triggerEventAction("PAUSE")}
                disabled={isUpdating}
                isLoading={isUpdating}
              >
                PAUSE EVENT
              </Button>
            )}

            {isPaused && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => triggerEventAction("RESUME")}
                disabled={isUpdating}
                isLoading={isUpdating}
              >
                RESUME EVENT
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => triggerEventAction("EXTEND_10M")}
              disabled={isUpdating}
            >
              +10 MIN EXTENSION
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => triggerEventAction("END_NOW")}
              disabled={isUpdating || isEnded}
            >
              END EVENT
            </Button>
          </div>

          {/* Questions Release Switch */}
          <div className="flex items-center gap-2 bg-paper p-1.5 border-2 border-ink rounded">
            <span className="font-mono text-[11px] font-bold text-ink uppercase px-1">
              QUESTIONS:
            </span>
            <button
              onClick={() =>
                triggerEventAction("TOGGLE_CASE_RELEASE", {
                  caseReleased: !eventState?.case_released,
                })
              }
              disabled={isUpdating}
              className={`px-2.5 py-1 rounded font-mono text-[11px] font-black uppercase transition-all border border-ink ${
                eventState?.case_released
                  ? "bg-success text-paper shadow-sm"
                  : "bg-cream text-danger hover:bg-danger hover:text-paper"
              }`}
            >
              {eventState?.case_released ? "SHOWING TO STUDENTS ✓" : "HIDDEN (LOCKED)"}
            </button>
          </div>
        </div>
      </Panel>

      {/* 2. Four Sleek KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Registered Students */}
        <div className="p-3.5 bg-paper border-2 border-ink rounded shadow-hard-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted">
              REGISTERED STUDENTS
            </span>
            <Fingerprint size={16} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-display text-3xl text-crimson font-black">
              {totalStudents}
            </span>
            <span className="font-mono text-xs text-muted font-bold">students</span>
          </div>
          <span className="font-mono text-[11px] text-muted block mt-0.5">
            Across {teams.length} registered teams
          </span>
        </div>

        {/* Solved Cases */}
        <div className="p-3.5 bg-paper border-2 border-ink rounded shadow-hard-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted">
              SOLVED CASES
            </span>
            <Trophy size={16} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-display text-3xl text-success font-black">
              {solvedCount}
            </span>
            <span className="font-mono text-xs text-muted font-bold">
              / {teams.length}
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted block mt-0.5">
            {teams.length > 0 ? Math.round((solvedCount / teams.length) * 100) : 0}% success rate
          </span>
        </div>

        {/* Total Submissions */}
        <div className="p-3.5 bg-paper border-2 border-ink rounded shadow-hard-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted">
              TOTAL ATTEMPTS
            </span>
            <CaseFolder size={16} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-display text-3xl text-ink font-black">
              {totalAttempts}
            </span>
            <span className="font-mono text-xs text-muted font-bold">logged</span>
          </div>
          <span className="font-mono text-[11px] text-muted block mt-0.5">
            Across active sessions
          </span>
        </div>

        {/* Database Health & Latency */}
        <div className="p-3.5 bg-paper border-2 border-ink rounded shadow-hard-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted">
              DATABASE LATENCY
            </span>
            <span className="w-2 h-2 rounded-full bg-success animate-ping" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-display text-3xl text-ink font-black">
              {latencyMs}
            </span>
            <span className="font-mono text-xs text-muted font-bold">ms</span>
          </div>
          <span className="font-mono text-[11px] text-muted block mt-0.5">
            PostgreSQL Service-Role active
          </span>
        </div>
      </div>

      {/* 3. Dual Main Feature Panels (Split 2-Column Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Leaderboard Overview */}
        <Panel className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2">
              <div className="flex items-center gap-2">
                <Trophy size={20} />
                <h2 className="font-display text-lg uppercase text-crimson font-black tracking-tight">
                  LIVE LEADERBOARD STANDINGS
                </h2>
              </div>
              <Link
                href="/admin/leaderboard"
                className="font-mono text-xs font-black text-crimson hover:underline"
              >
                VIEW FULL LEADERBOARD →
              </Link>
            </div>

            {topLeaderboard.length === 0 ? (
              <div className="p-6 text-center font-mono text-xs text-muted">
                NO TEAMS LOGGED IN STANDINGS YET.
              </div>
            ) : (
              <div className="space-y-2">
                {topLeaderboard.map((row) => (
                  <div
                    key={row.teamId}
                    className={`p-2.5 border-2 rounded flex items-center justify-between text-xs font-mono transition-all ${
                      row.rank === 1
                        ? "bg-amber-100/70 border-brass shadow-sm font-bold"
                        : "bg-paper border-ink/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-[11px] border border-ink ${
                          row.rank === 1
                            ? "bg-gold text-ink"
                            : row.rank === 2
                            ? "bg-slate-300 text-ink"
                            : row.rank === 3
                            ? "bg-amber-700 text-paper"
                            : "bg-crimson text-paper"
                        }`}
                      >
                        #{row.rank || "—"}
                      </span>
                      <div>
                        <span className="font-bold text-ink block">{row.teamName}</span>
                        <span className="text-[10px] text-muted">{row.teamId}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {row.solved ? (
                        <div>
                          <Badge variant="success" className="text-[9px]">
                            SOLVED ✓
                          </Badge>
                          <span className="block text-[10px] text-crimson font-black mt-0.5">
                            {row.solvedAtFormatted || "--"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted text-[11px]">{row.attempts} attempts</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-ink/15 flex items-center justify-between text-[11px] font-mono">
            <span className="text-muted">Auto-refreshes every 10 seconds</span>
            <Link
              href="/admin/leaderboard"
              className="px-3 py-1 bg-cream border border-ink rounded font-bold uppercase hover:bg-paper"
            >
              LAUNCH PROJECTOR REVEAL
            </Link>
          </div>
        </Panel>

        {/* Right Column: Registered Students & Teams Overview */}
        <Panel className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2">
              <div className="flex items-center gap-2">
                <Fingerprint size={20} />
                <h2 className="font-display text-lg uppercase text-crimson font-black tracking-tight">
                  REGISTERED STUDENTS & TEAMS
                </h2>
              </div>
              <Link
                href="/admin/teams"
                className="font-mono text-xs font-black text-crimson hover:underline"
              >
                VIEW ALL ({teams.length}) →
              </Link>
            </div>

            {/* Quick Search Input */}
            <input
              type="text"
              placeholder="Filter by student name or team..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-paper border border-ink rounded font-mono text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-crimson"
            />

            {filteredTeams.length === 0 ? (
              <div className="p-6 text-center font-mono text-xs text-muted">
                NO REGISTERED STUDENTS MATCHING SEARCH.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    className="p-2.5 bg-paper border border-ink/30 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">{team.name}</span>
                        <span className="px-1.5 py-0.2 bg-cream border border-ink/20 rounded text-[10px] text-muted">
                          {team.id}
                        </span>
                      </div>
                      {/* Registered Student Chips */}
                      {team.members && team.members.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.members.map((member, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 bg-cream border border-ink/30 rounded text-[10px] font-bold text-ink"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                          team.disabled
                            ? "bg-danger/10 text-danger border-danger"
                            : "bg-success/10 text-success border-success"
                        }`}
                      >
                        {team.disabled ? "SUSPENDED" : "ACTIVE"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-ink/15 flex items-center justify-between text-[11px] font-mono">
            <span className="text-muted">Total: {totalStudents} registered students</span>
            <Link
              href="/admin/teams/print"
              target="_blank"
              className="px-3 py-1 bg-crimson text-paper border border-ink rounded font-bold uppercase hover:bg-crimson-dark shadow-sm"
            >
              PRINT CREDENTIAL PASSES
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
