import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Tile } from "@/components/ui/Tile";
import { StatusBanner } from "@/components/ui/StatusBanner";
import {
  CaseFolder,
  Rulebook,
  CrystalBall,
  ChestIcon,
  Trophy,
  BadgeIcon,
  Wrench,
  Fingerprint,
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
    <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 my-auto">
      {/* 1. Main Logo Lockup */}
      <Logo />

      {/* 2. Inspector Irratino Quote Block */}
      <div className="max-w-[520px] w-full px-4 text-left border-l-3 border-crimson py-1 bg-cream/40 rounded-r">
        <p className="font-mono italic text-xs sm:text-sm text-ink leading-relaxed">
          &ldquo;{eventConfig.inspectorQuote}&rdquo;
        </p>
        <span className="block mt-1 font-mono text-xs font-bold text-crimson uppercase tracking-wider">
          — {eventConfig.inspectorName}
        </span>
      </div>

      {/* 3. Authoritative Live Status Banner */}
      <StatusBanner
        status={computed.status}
        remainingSeconds={computed.remainingSeconds}
        secondsUntilStart={computed.secondsUntilStart}
        someoneSolved={someoneSolved}
      />

      {/* 4. Retro Detective Tile Grid */}
      <div className="flex flex-col items-center gap-4 sm:gap-5 w-full max-w-2xl">
        {/* Row 1: Core Event Tiles */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4.5">
          <Tile href="/case" label="CASE FILES" icon={<CaseFolder />} id="tile-case-files" />
          <Tile href="/rules" label="RULES" icon={<Rulebook />} id="tile-rules" />
          <Tile href="/hints" label="HINTS" icon={<CrystalBall />} id="tile-hints" />
          <Tile href="/box" label="MYSTERY BOX" icon={<ChestIcon />} id="tile-box" />
          <Tile href="/leaderboard" label="LEADERBOARD" icon={<Trophy />} id="tile-leaderboard" />
        </div>

        {/* Row 2: Secondary & Access Tiles */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4.5">
          <Tile href="/about" label="ABOUT" icon={<BadgeIcon />} id="tile-about" />
          <Tile href="/help" label="HELP" icon={<Wrench />} id="tile-help" />
          <Tile
            href={team ? "/case" : "/enter"}
            label={team ? `TEAM: ${team.teamName || team.teamId}` : "ENTER AS TEAM"}
            icon={<Fingerprint />}
            isWide
            badge={team ? "LOGGED IN" : undefined}
            id="tile-team-access"
          />
        </div>
      </div>

      {/* 5. Team Access Prompt */}
      {!team && (
        <p className="font-mono text-xs text-muted text-center tracking-wider pt-2">
          TEAM MEMBER?{" "}
          <Link
            href="/enter"
            className="text-crimson font-bold underline decoration-2 hover:text-crimson-dark"
          >
            ENTER YOUR TEAM ID AND PIN.
          </Link>
        </p>
      )}
    </div>
  );
}
