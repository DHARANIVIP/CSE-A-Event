"use client";

import React, { useState, useEffect } from "react";
import { soundManager } from "./SoundManager";
import { SoundIcon } from "../icons";

export const SoundToggle: React.FC = () => {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    setIsMuted(soundManager.getIsMuted());
  }, []);

  const handleToggle = () => {
    const updated = soundManager.toggleMute();
    setIsMuted(updated);
  };

  return (
    <button
      onClick={handleToggle}
      className="p-1.5 bg-cream border-2 border-ink rounded shadow-hard-sm hover:shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center transition-all"
      aria-label={isMuted ? "Unmute audio effects" : "Mute audio effects"}
      title={isMuted ? "Sound: Off (Click to enable)" : "Sound: On"}
    >
      <SoundIcon size={18} muted={isMuted} />
    </button>
  );
};
