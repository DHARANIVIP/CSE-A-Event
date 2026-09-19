import React from "react";
import Link from "next/link";

interface TeamBadgeProps {
  teamId?: string | null;
  teamName?: string | null;
  onLogout?: () => void;
  className?: string;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  teamId,
  teamName,
  onLogout,
  className = "",
}) => {
  if (!teamId) {
    return (
      <Link
        href="/enter"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream border-2 border-ink rounded font-mono text-xs uppercase tracking-wider font-bold text-crimson shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard transition-all ${className}`}
      >
        <span>ENTER AS TEAM</span>
      </Link>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-cream border-2 border-ink rounded shadow-hard-sm ${className}`}>
      <div className="flex flex-col">
        <span className="font-mono text-[10px] text-muted uppercase font-bold tracking-wider leading-none">
          TEAM #{teamId}
        </span>
        <span className="font-mono text-xs text-ink font-bold leading-tight truncate max-w-[140px]">
          {teamName || teamId}
        </span>
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          className="font-mono text-[11px] text-crimson hover:text-crimson-dark uppercase font-bold underline decoration-1 ml-1"
          aria-label="Logout"
        >
          LOGOUT
        </button>
      )}
    </div>
  );
};
