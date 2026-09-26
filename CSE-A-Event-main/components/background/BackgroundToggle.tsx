"use client";

import React from "react";
import { RainIcon } from "../icons";
import { BackgroundPreferences } from "./useBackgroundPrefs";

interface BackgroundToggleProps {
  prefs: BackgroundPreferences;
}

export const BackgroundToggle: React.FC<BackgroundToggleProps> = ({ prefs }) => {
  return (
    <div className="inline-flex items-center gap-1 bg-cream border-2 border-ink rounded p-0.5 shadow-hard-sm">
      {/* Rain On/Off Switch */}
      <button
        type="button"
        onClick={() => prefs.setRainEnabled(!prefs.rainEnabled)}
        aria-pressed={prefs.rainEnabled}
        className={`px-2 py-1 rounded text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 select-none ${
          prefs.rainEnabled
            ? "bg-cyan-shadow text-paper border border-ink"
            : "bg-transparent text-muted hover:text-ink"
        }`}
        title={prefs.rainEnabled ? "Rain effect: Enabled" : "Rain effect: Disabled"}
      >
        <RainIcon size={14} />
        <span className="hidden sm:inline">{prefs.rainEnabled ? "RAIN ON" : "RAIN OFF"}</span>
      </button>
    </div>
  );
};
