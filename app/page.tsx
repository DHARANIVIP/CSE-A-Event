import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Tile } from "@/components/ui/Tile";
import { StatusBanner } from "@/components/ui/StatusBanner";
import {
  CaseFolder,
  Rulebook,
  ChestIcon,
  BadgeIcon,
  Fingerprint,
  Magnifier,
  Padlock,
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
    <div className="w-full max-w-6xl mx-auto space-y-10 sm:space-y-14 py-4 sm:py-8">
      {/* 1. Main Hero Command Header */}
      <section className="flex flex-col items-center justify-center space-y-6 text-center">
        {/* Main Logo Lockup */}
        <Logo />

        {/* Inspector Irratino Quote Block */}
        <div className="max-w-2xl sm:max-w-3xl w-full px-5 py-3 text-left border-l-4 border-crimson bg-cream/80 rounded-r shadow-hard-sm backdrop-blur-sm">
          <p className="font-mono italic text-xs sm:text-sm text-ink leading-relaxed">
            &ldquo;{eventConfig.inspectorQuote}&rdquo;
          </p>
          <span className="block mt-1.5 font-mono text-xs font-black text-crimson uppercase tracking-wider">
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
        <div className="w-full max-w-4xl pt-2">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Tile href="/case" label="CASE FILES" icon={<CaseFolder />} id="tile-case-files" />
            <Tile href="/rules" label="RULES" icon={<Rulebook />} id="tile-rules" />
            <Tile href="/box" label="MYSTERY BOX" icon={<ChestIcon />} id="tile-box" />
            <Tile href="/about" label="ABOUT" icon={<BadgeIcon />} id="tile-about" />
            <Tile
              href={team ? "/case" : "/enter"}
              label={team ? `TEAM: ${team.teamName || team.teamId}` : "ENTER AS TEAM"}
              icon={<Fingerprint />}
              isWide
              badge={team ? "LOGGED IN" : undefined}
              id="tile-team-access"
            />
          </div>

          {/* Team Access Prompt */}
          {!team && (
            <p className="font-mono text-xs text-muted text-center tracking-wider pt-4">
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

      {/* 2. Investigation Protocol // Mission Sequence */}
      <section className="bg-paper border-3 border-ink rounded-md shadow-hard p-6 sm:p-8">
        <div className="border-b-2 border-ink/20 pb-4 mb-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-block w-3 h-3 bg-crimson rounded-full animate-pulse" />
            <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest">
              OFFICIAL INVESTIGATION PROTOCOL
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl uppercase text-crimson font-black tracking-tight mt-1">
            HOW THE INVESTIGATION WORKS
          </h2>
          <p className="font-mono text-xs sm:text-sm text-muted mt-1">
            Follow the 4-phase sequential protocol to inspect evidence, solve the questions, and crack the case lock.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 bg-cream/70 border-2 border-ink rounded shadow-hard-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-crimson text-paper font-mono text-xs font-black flex items-center justify-center border border-ink">
                  01
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-paper border border-ink rounded text-crimson font-bold uppercase">
                  HARD COPY
                </span>
              </div>
              <h3 className="font-display text-base uppercase text-crimson font-black tracking-tight">
                COLLECT DOSSIER
              </h3>
              <p className="font-mono text-xs text-ink/90 leading-relaxed mt-2">
                Coordinators will distribute the official physical evidence dossier in the lab. Keep all sheets organized at your workstation.
              </p>
            </div>
            <div className="pt-2 border-t border-ink/15 font-mono text-[10px] text-muted uppercase font-bold">
              Provided by Team in Person
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-cream/70 border-2 border-ink rounded shadow-hard-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-crimson text-paper font-mono text-xs font-black flex items-center justify-center border border-ink">
                  02
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-paper border border-ink rounded text-ink font-bold uppercase">
                  FORENSICS
                </span>
              </div>
              <h3 className="font-display text-base uppercase text-crimson font-black tracking-tight">
                ANALYZE & CROSS-EXAMINE
              </h3>
              <p className="font-mono text-xs text-ink/90 leading-relaxed mt-2">
                Parse system logs, DHCP device leases, access logs, and network captures using Python, pandas, Wireshark, SQL, or AI assistants.
              </p>
            </div>
            <div className="pt-2 border-t border-ink/15 font-mono text-[10px] text-muted uppercase font-bold">
              All Tools Authorized
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-cream/70 border-2 border-ink rounded shadow-hard-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-crimson text-paper font-mono text-xs font-black flex items-center justify-center border border-ink">
                  03
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-paper border border-ink rounded text-ink font-bold uppercase">
                  5 CLUES
                </span>
              </div>
              <h3 className="font-display text-base uppercase text-crimson font-black tracking-tight">
                SOLVE 5 QUESTIONS
              </h3>
              <p className="font-mono text-xs text-ink/90 leading-relaxed mt-2">
                Answer the 5 investigative questions sequentially. Each solved question reveals exactly one alphanumeric character of the lock code.
              </p>
            </div>
            <div className="pt-2 border-t border-ink/15 font-mono text-[10px] text-muted uppercase font-bold">
              Sequential Dependency
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 bg-cream/70 border-2 border-ink rounded shadow-hard-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-crimson text-paper font-mono text-xs font-black flex items-center justify-center border border-ink">
                  04
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-paper border border-ink rounded text-gold font-bold uppercase">
                  FINAL STEP
                </span>
              </div>
              <h3 className="font-display text-base uppercase text-crimson font-black tracking-tight">
                UNLOCK MYSTERY BOX
              </h3>
              <p className="font-mono text-xs text-ink/90 leading-relaxed mt-2">
                Concatenate the 5 derived characters in order. Enter the 5-character cipher into the Mystery Box portal to secure your rank.
              </p>
            </div>
            <div className="pt-2 border-t border-ink/15 font-mono text-[10px] text-muted uppercase font-bold">
              Server Timestamp Locked
            </div>
          </div>
        </div>
      </section>

      {/* 3. Operational Field Intel Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Chronological Ranking */}
        <div className="bg-paper border-3 border-ink rounded-md shadow-hard-sm p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Padlock size={20} />
            <h3 className="font-display text-lg uppercase text-crimson font-black tracking-tight">
              SERVER-SIDE RANKING
            </h3>
          </div>
          <p className="font-mono text-xs text-ink leading-relaxed">
            All submissions are strictly serialized by the PostgreSQL database clock. Local workstation time has zero influence on competitive standing.
          </p>
        </div>

        {/* Card 2: Permitted Forensics Arsenal */}
        <div className="bg-paper border-3 border-ink rounded-md shadow-hard-sm p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Magnifier size={20} />
            <h3 className="font-display text-lg uppercase text-crimson font-black tracking-tight">
              AUTHORIZED ARSENAL
            </h3>
          </div>
          <p className="font-mono text-xs text-ink leading-relaxed">
            Python, pandas, Jupyter, Excel, terminal utilities (grep, awk), and generative AI models are fully permitted. Inter-team collusion is prohibited.
          </p>
        </div>

        {/* Card 3: Help Desk & Organizers */}
        <div className="bg-paper border-3 border-ink rounded-md shadow-hard-sm p-5 space-y-2">
          <div className="flex items-center gap-2">
            <BadgeIcon size={20} />
            <h3 className="font-display text-lg uppercase text-crimson font-black tracking-tight">
              PHYSICAL HELP DESK
            </h3>
          </div>
          <p className="font-mono text-xs text-ink leading-relaxed">
            If your station loses connection, approach the organizer desk in Central Computing Facility 3. Hand in your printed team pass for manual submission.
          </p>
        </div>
      </section>

      {/* 4. Ready to Investigate Callout */}
      <section className="bg-gradient-to-r from-cream to-paper border-3 border-ink rounded-md shadow-hard p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div>
          <span className="font-mono text-xs font-black text-crimson uppercase tracking-widest block">
            {team ? "AUTHENTICATED DETECTIVE CREW" : "STATION DISPATCH ACTIVE"}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl uppercase text-crimson font-black tracking-tight mt-1">
            {team ? `READY TO CRACK THE CASE, ${team.teamName}?` : "READY TO COMMENCE THE INVESTIGATION?"}
          </h2>
          <p className="font-mono text-xs sm:text-sm text-ink/80 mt-1">
            {team
              ? "Access your case briefing and the 5 investigative questions to derive the lock code."
              : "Sign in with your team credential pass to access case files and submit your code."}
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
