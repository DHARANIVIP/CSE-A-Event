"use client";

import React, { useState, useEffect } from "react";

export const RulesCheckbox: React.FC = () => {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mb_rules_acknowledged");
      if (stored === "true") {
        setAcknowledged(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAcknowledged(checked);
    try {
      localStorage.setItem("mb_rules_acknowledged", String(checked));
    } catch {
      // ignore
    }
  };

  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={acknowledged}
        onChange={handleChange}
        className="w-5 h-5 mt-0.5 rounded border-2 border-ink accent-crimson cursor-pointer"
      />
      <div className="space-y-0.5">
        <span className="font-mono text-sm font-bold text-ink uppercase tracking-wide block">
          I HAVE READ AND AGREE TO ABIDE BY ALL OFFICIAL EVENT RULES
        </span>
        <span className="font-mono text-xs text-muted block">
          Stores local confirmation only. No personally identifiable telemetry is transmitted.
        </span>
      </div>
    </label>
  );
};
