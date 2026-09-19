"use client";

import React, { useState, useEffect } from "react";
import { formatCountdown } from "@/lib/time";

export type SubmissionResultType =
  | "idle"
  | "incorrect"
  | "correct_first"
  | "correct_other"
  | "already_solved"
  | "cooldown"
  | "error";

export interface ResultBannerData {
  type: SubmissionResultType;
  rank?: number | null;
  solvedAtFormatted?: string | null;
  attemptsBeforeCooldown?: number;
  cooldownSeconds?: number;
  errorMessage?: string;
}

interface ResultBannerProps {
  data: ResultBannerData;
  onCooldownFinish?: () => void;
}

export const ResultBanner: React.FC<ResultBannerProps> = ({
  data,
  onCooldownFinish,
}) => {
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  useEffect(() => {
    if (data.cooldownSeconds && data.cooldownSeconds > 0) {
      setCooldownRemaining(data.cooldownSeconds);

      const interval = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (onCooldownFinish) onCooldownFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [data.cooldownSeconds, onCooldownFinish]);

  if (data.type === "idle") return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full max-w-md mx-auto my-4 select-none font-mono text-center"
    >
      {/* 1. Correct & First Solver */}
      {data.type === "correct_first" && (
        <div className="p-5 bg-gold border-4 border-ink rounded-md shadow-hard-lg space-y-2 animate-bounce">
          <span className="px-2.5 py-1 bg-paper text-crimson font-black text-xs rounded border-2 border-ink uppercase tracking-wider">
            ★ #1 OFFICIAL WINNER ★
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-ink font-black uppercase tracking-tight">
            CASE SOLVED — YOU ARE THE FIRST!
          </h2>
          <div className="text-xs font-bold text-ink/90">
            OFFICIAL SERVER TIMESTAMP:{" "}
            <span className="text-crimson font-black">{data.solvedAtFormatted}</span>
          </div>
          <div className="pt-2 border-t-2 border-ink text-xs font-black text-crimson uppercase">
            PLEASE SHOW THIS DISPLAY SCREEN TO AN ORGANIZER IMMEDIATELY!
          </div>
        </div>
      )}

      {/* 2. Correct but Ranked > 1 */}
      {data.type === "correct_other" && (
        <div className="p-5 bg-cream border-4 border-ink rounded-md shadow-hard space-y-2">
          <span className="px-2 py-0.5 bg-crimson text-paper font-black text-xs rounded border border-ink uppercase">
            CASE SOLVED
          </span>
          <h2 className="font-display text-2xl text-crimson font-black uppercase tracking-tight">
            CASE SOLVED — YOU ARE TEAM #{data.rank}
          </h2>
          <div className="text-xs font-bold text-ink">
            RECORDED AT: <span className="text-crimson font-mono">{data.solvedAtFormatted}</span>
          </div>
          <p className="text-xs text-muted">
            Your final standing has been registered on the live leaderboard.
          </p>
        </div>
      )}

      {/* 3. Already Solved on Reload */}
      {data.type === "already_solved" && (
        <div className="p-4 bg-cream border-3 border-ink rounded shadow-hard space-y-1">
          <h2 className="font-display text-lg text-crimson font-black uppercase">
            YOUR TEAM HAS ALREADY CRACKED THIS CASE.
          </h2>
          <div className="text-xs font-mono text-ink">
            Official Rank: #{data.rank} · Recorded: {data.solvedAtFormatted}
          </div>
        </div>
      )}

      {/* 4. Incorrect Submission */}
      {data.type === "incorrect" && (
        <div className="p-4 bg-danger/10 border-3 border-danger rounded text-danger shadow-hard space-y-1 animate-shake">
          <div className="font-display text-xl uppercase font-black">
            THE BOX STAYS LOCKED.
          </div>
          <div className="font-mono text-xs font-bold">
            {data.attemptsBeforeCooldown !== undefined && (
              <span>ATTEMPTS BEFORE COOLDOWN: {data.attemptsBeforeCooldown}</span>
            )}
          </div>
        </div>
      )}

      {/* 5. Cooldown Lockout */}
      {data.type === "cooldown" && (
        <div className="p-4 bg-danger text-paper border-3 border-ink rounded shadow-hard space-y-1 animate-pulse">
          <div className="font-display text-xl uppercase font-black">
            COOLDOWN ACTIVE
          </div>
          <div className="font-mono text-sm font-black tracking-widest">
            TRY AGAIN IN {formatCountdown(cooldownRemaining)}
          </div>
          <p className="font-mono text-[11px] text-paper/80">
            Escalating lockout enforced to protect against brute-force attacks.
          </p>
        </div>
      )}

      {/* 6. Network / Server Error */}
      {data.type === "error" && (
        <div className="p-4 bg-muted/20 border-3 border-ink rounded text-ink shadow-hard space-y-1">
          <div className="font-display text-lg uppercase font-black text-danger">
            THE LINE WENT DEAD.
          </div>
          <div className="font-mono text-xs font-bold">
            {data.errorMessage || "CHECK YOUR CONNECTION AND TRY AGAIN."}
          </div>
        </div>
      )}
    </div>
  );
};
