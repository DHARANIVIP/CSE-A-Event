"use client";

import React, { useState, useEffect, useCallback } from "react";
import { soundManager } from "@/components/sound/SoundManager";

interface CaseIntroGateProps {
  caseTitle?: string;
  fileNumber?: string;
}

export const CaseIntroGate: React.FC<CaseIntroGateProps> = ({
  caseTitle = "THE CODEOCLOCK\nFILE",
  fileNumber = "CASE FILE  Nº  2K26",
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Check if user already opened the case during this browser session
    try {
      const alreadyOpened = sessionStorage.getItem("mb_case_intro_opened");
      if (alreadyOpened === "true") {
        setIsOpen(false);
      }
    } catch {}
  }, []);

  const handleOpenCase = useCallback(() => {
    if (isFadingOut) return;

    // Unmute audio & play authentic case opening acoustics
    soundManager.setMuted(false);
    const ctx = soundManager.getContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // 1. Heavy rubber stamp / dossier slam thud
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);

        // 2. Mechanical brass lock click
        soundManager.playLockClick();
      } catch {}
    }

    // Begin cinematic dissolve
    setIsFadingOut(true);

    try {
      sessionStorage.setItem("mb_case_intro_opened", "true");
    } catch {}

    setTimeout(() => {
      setIsOpen(false);
    }, 650);
  }, [isFadingOut]);

  if (!mounted || !isOpen) return null;

  return (
    <div
      onClick={handleOpenCase}
      className={`fixed inset-0 z-[100] flex flex-col justify-between items-center bg-[#070605] text-[#F4EEE2] select-none cursor-pointer overflow-hidden transition-all duration-700 ${
        isFadingOut ? "opacity-0 scale-[1.02] pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 30%, rgba(212, 140, 70, 0.16) 0%, rgba(184, 115, 51, 0.06) 45%, rgba(7, 6, 5, 0.98) 85%)",
      }}
      role="dialog"
      aria-label="Case File Entry Portal"
    >
      {/* 35mm Procedural Film Grain & CRT Scanline Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0px, rgba(0, 0, 0, 0.25) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Atmospheric Heavy Edge Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 140px 40px rgba(0, 0, 0, 0.95)",
        }}
      />

      {/* Top Header Row */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-12 pt-6 sm:pt-8 flex items-center justify-between z-10">
        {/* Top-Left: CASE FILE Nº 2K26 */}
        <span className="font-mono text-xs sm:text-sm text-[#c7a462]/40 tracking-[0.25em] uppercase">
          {fileNumber}
        </span>

        {/* Top-Right: ● REC */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B30033] animate-pulse shadow-[0_0_8px_#B30033]" />
          <span className="font-mono text-xs sm:text-sm text-[#B30033] font-bold tracking-[0.25em]">
            REC
          </span>
        </div>
      </header>

      {/* Center Hero Lockup */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto my-auto space-y-6 sm:space-y-8">
        {/* Monospace Sub-label */}
        <span className="font-mono text-xs sm:text-sm md:text-base text-[#c7a462] tracking-[0.35em] uppercase font-bold drop-shadow-sm">
          {fileNumber}
        </span>

        {/* Massive Bold Block Serif Headline */}
        <h1
          className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#f4eee2] leading-[1.1] sm:leading-[1.15]"
          style={{
            textShadow:
              "0 0 35px rgba(212, 175, 55, 0.35), 0 0 70px rgba(184, 115, 51, 0.18), 0 4px 8px rgba(0,0,0,0.9)",
          }}
        >
          {caseTitle.split("\n").map((line, idx) => (
            <span key={idx} className="block">
              {line}
            </span>
          ))}
        </h1>

        {/* Open The Case Action Button */}
        <div className="pt-2 sm:pt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCase();
            }}
            className="group relative px-7 py-3.5 sm:px-9 sm:py-4 bg-[#0a0806]/90 border border-[#b88d3d] hover:border-[#f5d98b] rounded-xs text-[#e6c36a] hover:text-[#fff4d1] font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(184,141,61,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
          >
            <span className="text-[#e6c36a] group-hover:text-[#fff4d1] transition-transform group-hover:translate-x-0.5">
              ▶
            </span>
            <span>OPEN THE CASE</span>
          </button>
        </div>

        {/* Subtext: SOUND ON · CLICK ANYWHERE TO BEGIN */}
        <p className="font-mono text-[10px] sm:text-xs text-[#8c734b] tracking-[0.3em] uppercase pt-2 opacity-85">
          SOUND ON · CLICK ANYWHERE TO BEGIN
        </p>
      </main>

      {/* Bottom Spacer / Subtle Footer Anchor */}
      <footer className="w-full pb-6 sm:pb-8 text-center z-10 pointer-events-none">
        <span className="font-mono text-[10px] text-[#544533] tracking-[0.25em] uppercase">
          FORENSIC EVIDENCE REPOSITORY · SECURE ACCESS
        </span>
      </footer>
    </div>
  );
};
