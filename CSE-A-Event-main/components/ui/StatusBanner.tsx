import React from "react";
import { formatCountdown } from "@/lib/time";
import { eventConfig } from "@/config/event.config";

export interface StatusBannerProps {
  status: "not_started" | "live" | "ended" | "paused";
  remainingSeconds: number;
  secondsUntilStart: number;
  someoneSolved?: boolean;
  className?: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  status,
  remainingSeconds,
  secondsUntilStart,
  someoneSolved = false,
  className = "",
}) => {
  let message = "";
  let toneStyles = "bg-cream text-ink border-ink";

  switch (status) {
    case "not_started":
      message = `THE CASE OPENS IN ${formatCountdown(secondsUntilStart)}.`;
      toneStyles = "bg-cream text-ink border-ink";
      break;
    case "live":
      message = `THE CASE IS OPEN. CLOSES IN ${formatCountdown(remainingSeconds)}.`;
      toneStyles = "bg-cream text-crimson border-ink";
      break;
    case "paused":
      message = "THE CASE IS TEMPORARILY PAUSED BY ORGANIZERS.";
      toneStyles = "bg-gold text-ink border-ink";
      break;
    case "ended":
      message = "THE CASE IS CLOSED.";
      toneStyles = "bg-muted/20 text-muted border-muted";
      break;
  }

  const showGlobalSolver =
    someoneSolved && eventConfig.features.showFirstSolverGlobalAlert;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full max-w-content mx-auto my-3 px-4 py-2.5 rounded-sm border-2 shadow-hard-sm flex flex-col sm:flex-row items-center justify-between gap-2 text-center select-none font-mono text-xs sm:text-sm font-black uppercase tracking-wider ${toneStyles} ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full border border-ink ${
            status === "live"
              ? "bg-success animate-ping"
              : status === "paused"
              ? "bg-gold"
              : "bg-danger"
          }`}
          aria-hidden="true"
        />
        <span>{message}</span>
      </div>

      {showGlobalSolver && (
        <span className="text-[11px] text-crimson bg-paper px-2 py-0.5 rounded border border-ink font-bold animate-pulse">
          A TEAM HAS CRACKED IT! KEEP GOING FOR RANK.
        </span>
      )}
    </div>
  );
};
