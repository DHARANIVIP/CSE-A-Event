import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Tile } from "@/components/ui/Tile";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { CaseDossier } from "@/components/home/CaseDossier";
import {
  CaseFolder,
  Rulebook,
  ChestIcon,
  BadgeIcon,
  Fingerprint,
  Trophy,
} from "@/components/icons";
import { getTeamSession } from "@/lib/auth";
import { calculateEventStatus } from "@/lib/time";
import { mockDB } from "@/lib/supabase-server";
import { eventConfig } from "@/config/event.config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const team = await getTeamSession();

  // Retrieve current event state from DB or server state
  const computed = calculateEventStatus({
    startAt: mockDB.eventState.start_at,
    endAt: mockDB.eventState.end_at,
    forceStatus: mockDB.eventState.force_status,
    caseReleased: mockDB.eventState.case_released,
  });

  const someoneSolved = mockDB.submissions.some((s) => s.is_correct);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 py-2 sm:py-4">
      {/* 1. Main Hero Command Header */}
      <section className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
        {/* Main Logo Lockup */}
        <Logo />

        {/* Inspector Irratino Quote Block */}
        <div className="max-w-2xl sm:max-w-3xl w-full px-4 py-2 text-left border-l-4 border-crimson bg-cream/80 rounded-r shadow-hard-sm backdrop-blur-sm">
          <p className="font-mono italic text-xs text-ink leading-relaxed">
            &ldquo;{eventConfig.inspectorQuote}&rdquo;
          </p>
          <span className="block mt-1 font-mono text-[11px] font-black text-crimson uppercase tracking-wider">
            — {eventConfig.inspectorName}
          </span>
        </div>

        {/* Live Authoritative Status Banner */}
        <div className="w-full max-w-4xl">
          <StatusBanner
            status={computed.status}
            remainingSeconds={computed.remainingSeconds}
            secondsUntilStart={computed.secondsUntilStart}
            someoneSolved={someoneSolved}
          />
        </div>

        {/* Retro Detective Command Deck */}
        <div className="w-full max-w-4xl pt-1 flex flex-col items-center gap-3 sm:gap-4">
          {/* Top wide card: ENTER AS TEAM */}
          <Tile
            href={team ? "/case" : "/enter"}
            label={team ? `TEAM: ${team.teamName || team.teamId}` : "ENTER AS TEAM"}
            icon={<Fingerprint />}
            isWide
            badge={team ? "LOGGED IN" : undefined}
            id="tile-team-access"
          />

          {/* Single horizontal row for navigation cards */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Tile href="/case" label="CASE FILES" icon={<CaseFolder />} id="tile-case-files" />
            <Tile href="/rules" label="RULES" icon={<Rulebook />} id="tile-rules" />
            <Tile href="/box" label="MYSTERY BOX" icon={<ChestIcon />} id="tile-box" />
            <Tile href="/leaderboard" label="LEADERBOARD" icon={<Trophy />} id="tile-leaderboard" />
            <Tile href="/about" label="ABOUT" icon={<BadgeIcon />} id="tile-about" />
          </div>

          {/* Team Access Prompt */}
          {!team && (
            <p className="font-mono text-xs text-muted text-center tracking-wider pt-1">
              TEAM MEMBER?{" "}
              <Link
                href="/enter"
                className="text-crimson font-black underline decoration-2 hover:text-crimson-dark"
              >
                ENTER YOUR TEAM ID AND PIN.
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* 2. Interactive Manila Detective Case Dossier */}
      <CaseDossier />

      {/* 3. Dispatch Action Callout */}
      <section className="bg-gradient-to-r from-cream to-paper border-3 border-ink rounded-md shadow-hard p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        <div>
          <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
            {team ? "AUTHENTICATED DETECTIVE CREW" : "STATION DISPATCH ACTIVE"}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl uppercase text-crimson font-black tracking-tight mt-1">
            {team ? `READY TO CRACK THE CASE, ${team.teamName}?` : "READY TO COMMENCE THE INVESTIGATION?"}
          </h2>
          <p className="font-mono text-xs sm:text-sm text-ink/80 mt-1">
            {team
              ? "Access case files, datasets, and the 10 investigation questions."
              : "Sign in with your team badge pass to access case files and submit your code."}
          </p>
        </div>

        <Link
          href={team ? "/case" : "/enter"}
          className="px-6 py-3 bg-crimson text-paper border-3 border-ink rounded font-mono text-sm font-black uppercase tracking-wider shadow-hard hover:shadow-hard-lg hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none whitespace-nowrap transition-all"
        >
          {team ? "OPEN CASE FILES →" : "ENTER TEAM ID & PIN →"}
        </Link>
      </section>
    </div>
  );
}
