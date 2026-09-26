"use client";

import React from "react";
import { Trophy } from "@/components/icons";
import { soundManager } from "@/components/sound/SoundManager";

export const LeaderboardTriggerButton: React.FC = () => {
  const handleClick = () => {
    soundManager.playClick();
    window.dispatchEvent(new CustomEvent("open-leaderboard"));
  };

  return (
    <button
      onClick={handleClick}
      className="px-3.5 py-2 bg-gold/25 hover:bg-gold/40 border-2 border-ink rounded font-mono text-xs font-bold text-ink uppercase tracking-wider shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 select-none"
      title="Open Live Leaderboard Sidebar"
    >
      <Trophy size={16} />
      <span>VIEW LEADERBOARD (SIDEBAR)</span>
    </button>
  );
};
