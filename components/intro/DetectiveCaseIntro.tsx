"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * Target destination URL after clicking Play / Open Case.
 * Defaults to the main landing page ("/"), but can be any internal or external URL.
 */
export const EXTERNAL_REDIRECT_LINK: string = "/";

export const DETECTRIX_INTRO_CONFIG = {
  caseFileNumber: "CASE FILE № 2K26",
  titleLine1: "THE",
  titleLine2: "DETECTRIX FILE",
  tagline: "Investigate. Connect. Decode. Unlock.",
  department: "DEPARTMENT OF CSE",
  venue: "KSRCE CAMPUS",
  duration: "6HRS MYSTERY WORLD",
  bounty: "SPECIAL GIFTS & CASH BOUNTY",
  audioSrc: "/audio/cowboy-theme.mp3",
  audioDurationMs: 12000, // Exactly 12 seconds per user instruction
  backgroundImage: "/assets/intro-scene-2.jpg",
};

// ============================================================================
// 2. DETECTIVE CASE INTRO COMPONENT (SINGLE PAGE EDITION)
// ============================================================================

interface DetectiveCaseIntroProps {
  redirectUrl?: string;
  onEnterInvestigation?: () => void;
}

export const DetectiveCaseIntro: React.FC<DetectiveCaseIntroProps> = ({
  redirectUrl = EXTERNAL_REDIRECT_LINK,
  onEnterInvestigation,
}) => {
  const router = useRouter();

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioSecondsRemaining, setAudioSecondsRemaining] = useState<number>(12);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioFadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCountdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistent audio element mounted on document.body so client routing preserves playback
  const getOrCreateAudio = useCallback((): HTMLAudioElement | null => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      let audio = document.getElementById("detectrix-cowboy-theme-audio") as HTMLAudioElement;
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "detectrix-cowboy-theme-audio";
        audio.src = DETECTRIX_INTRO_CONFIG.audioSrc;
        audio.preload = "auto";
        audio.loop = false;
        document.body.appendChild(audio);
      }
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  // Trigger 12-second background music playback
  const startAudioPlayback = useCallback((): boolean => {
    const audio = getOrCreateAudio();
    if (!audio) return false;

    try {
      audio.currentTime = 0;
      audio.volume = 0.9;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio autoplay blocked or interrupted:", err);
        });
      }
    } catch (e) {
      console.warn("Audio play exception:", e);
    }

    setIsPlayingAudio(true);
    setAudioSecondsRemaining(12);

    // 1-second countdown ticker
    if (audioCountdownIntervalRef.current) {
      clearInterval(audioCountdownIntervalRef.current);
    }
    audioCountdownIntervalRef.current = setInterval(() => {
      setAudioSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (audioCountdownIntervalRef.current) {
            clearInterval(audioCountdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Audio fade-out during the final 1.8 seconds of the 12s window
    const FADE_START_MS = 10200;
    setTimeout(() => {
      if (audioFadeIntervalRef.current) clearInterval(audioFadeIntervalRef.current);
      audioFadeIntervalRef.current = setInterval(() => {
        if (audio && audio.volume > 0.08) {
          audio.volume = Math.max(0, audio.volume - 0.12);
        } else if (audio) {
          audio.volume = 0;
          if (audioFadeIntervalRef.current) clearInterval(audioFadeIntervalRef.current);
        }
      }, 150);
    }, FADE_START_MS);

    // Stop playback strictly at 12 seconds
    if (audioStopTimerRef.current) clearTimeout(audioStopTimerRef.current);
    audioStopTimerRef.current = setTimeout(() => {
      try {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0.9;
        }
      } catch {}
      setIsPlayingAudio(false);
      if (audioFadeIntervalRef.current) clearInterval(audioFadeIntervalRef.current);
      if (audioCountdownIntervalRef.current) clearInterval(audioCountdownIntervalRef.current);
    }, DETECTRIX_INTRO_CONFIG.audioDurationMs);

    return true;
  }, [getOrCreateAudio]);

  // Handle Play Button Click: Starts background music + smoothly opens landing page
  const handlePlayAndEnter = useCallback(() => {
    if (isNavigating) return;

    // 1. Start 12-second background music on this explicit user click gesture
    startAudioPlayback();

    // 2. Visual camera shutter flash wipe
    setIsFlashing(true);
    setIsNavigating(true);

    try {
      sessionStorage.setItem("introSeen", "true");
    } catch {}

    // 3. Seamless Next.js client-side navigation preserves the playing audio element
    setTimeout(() => {
      if (onEnterInvestigation) {
        onEnterInvestigation();
      } else if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
        window.location.href = redirectUrl;
      } else {
        router.push(redirectUrl);
      }
    }, 450);
  }, [isNavigating, onEnterInvestigation, redirectUrl, router, startAudioPlayback]);

  // Audio preview toggle (plays/stops sound without immediate redirect)
  const handleToggleAudioOnly = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = getOrCreateAudio();
    if (!audio) return;

    if (isPlayingAudio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
      setIsPlayingAudio(false);
      if (audioStopTimerRef.current) clearTimeout(audioStopTimerRef.current);
      if (audioFadeIntervalRef.current) clearInterval(audioFadeIntervalRef.current);
      if (audioCountdownIntervalRef.current) clearInterval(audioCountdownIntervalRef.current);
    } else {
      startAudioPlayback();
    }
  }, [getOrCreateAudio, isPlayingAudio, startAudioPlayback]);

  // Direct bypass to landing page without audio
  const handleDirectBypass = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isNavigating) return;
    setIsFlashing(true);
    setIsNavigating(true);
    try {
      sessionStorage.setItem("introSeen", "true");
    } catch {}
    setTimeout(() => {
      if (onEnterInvestigation) {
        onEnterInvestigation();
      } else if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
        window.location.href = redirectUrl;
      } else {
        router.push(redirectUrl);
      }
    }, 350);
  }, [isNavigating, onEnterInvestigation, redirectUrl, router]);

  // Keyboard accessibility: Space / Enter / Play trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePlayAndEnter();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleDirectBypass();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDirectBypass, handlePlayAndEnter]);

  // Clean-up timers on unmount (keep audio playing on body until 12s expires)
  useEffect(() => {
    return () => {
      if (audioCountdownIntervalRef.current) clearInterval(audioCountdownIntervalRef.current);
    };
  }, []);

  return (
    <main
      id="detectrix-intro-container"
      className="relative w-screen h-screen overflow-hidden bg-black text-[#f4ecd8] select-none flex flex-col justify-between"
      style={{ isolation: "isolate" }}
      aria-label="Detective Case File Introduction"
    >
      {/* ========================================================
          1. CINEMATIC FULL-BLEED BACKGROUND WITH SLOW DRIFT
          ======================================================== */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src={DETECTRIX_INTRO_CONFIG.backgroundImage}
          alt="Detective Evidence Board Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.38] contrast-[1.2] sepia-[0.35] scale-105 animate-[kenBurnsSubtle_25s_ease-in-out_infinite_alternate]"
        />

        {/* Noir Atmosphere Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.85)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(232,196,104,0.12),transparent_70%)]" />
        <div className="detectrix-scanlines absolute inset-0 pointer-events-none opacity-20" />
        <div className="detectrix-grain absolute inset-0 pointer-events-none opacity-25" />
      </div>

      {/* Camera Shutter Flash on Entry */}
      {isFlashing && (
        <div
          className="detectrix-shutter-flash absolute inset-0 z-50 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Cinematic 3px Letterbox Borders */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0c0814] z-40 border-b border-[#e8c468]/20" />
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0c0814] z-40 border-t border-[#e8c468]/20" />

      {/* ========================================================
          2. TOP HUD: CLASSIFIED STATUS & DIRECT ACCESS
          ======================================================== */}
      <header className="relative z-30 pt-4 sm:pt-6 px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Case ID Badge */}
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-red-500 -ml-[18px]" />
          <span className="detectrix-hud-font text-xs sm:text-sm tracking-widest text-[#e8c468]/90 font-bold uppercase">
            {DETECTRIX_INTRO_CONFIG.caseFileNumber} // CLASSIFIED BRIEFING
          </span>
        </div>

        {/* Right: Audio Indicator & Skip Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Audio Status Pill */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded border text-[11px] font-mono tracking-wider transition-all ${
              isPlayingAudio
                ? "bg-[#e8c468]/15 border-[#e8c468] text-[#e8c468]"
                : "bg-black/60 border-zinc-800 text-zinc-400"
            }`}
          >
            {isPlayingAudio ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8c468] animate-pulse" />
                <span>MUSIC ACTIVE [{audioSecondsRemaining}s]</span>
                <span className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 bg-[#e8c468] animate-[soundBar_0.8s_ease-in-out_infinite_0.1s] h-full" />
                  <span className="w-0.5 bg-[#e8c468] animate-[soundBar_0.8s_ease-in-out_infinite_0.3s] h-2/3" />
                  <span className="w-0.5 bg-[#e8c468] animate-[soundBar_0.8s_ease-in-out_infinite_0.5s] h-4/5" />
                </span>
              </>
            ) : (
              <>
                <span className="text-zinc-500">♫</span>
                <span>AUDIO: READY (12s THEME)</span>
              </>
            )}
          </div>

          {/* Quick Bypass Link */}
          <button
            type="button"
            onClick={handleDirectBypass}
            className="detectrix-hud-font text-[11px] sm:text-xs font-semibold tracking-widest text-[#e8c468]/80 hover:text-[#e8c468] uppercase px-3 py-1.5 bg-black/60 hover:bg-black/90 border border-[#e8c468]/30 hover:border-[#e8c468] rounded transition-all cursor-pointer"
            title="Skip directly to the portal"
          >
            SKIP TO PORTAL »
          </button>
        </div>
      </header>

      {/* ========================================================
          3. MAIN DOSSIER: "THE DETECTRIX FILE" & PLAY BUTTON
          Reduced typography, compact detective layout, single page
          ======================================================== */}
      <section className="relative z-30 flex-1 flex items-center justify-center px-4 sm:px-6 py-4">
        <div className="w-full max-w-2xl bg-black/75 sm:bg-black/80 backdrop-blur-xl border border-[#e8c468]/35 rounded-xl p-6 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_20px_rgba(232,196,104,0.12)] text-center relative overflow-hidden">
          {/* Subtle Top Amber Glow Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#e8c468] to-transparent" />

          {/* Dossier Header Stamp */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#e8c468]/10 border border-[#e8c468]/25 mb-4 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8c468]" />
            <span className="detectrix-hud-font text-[11px] sm:text-xs font-bold tracking-widest text-[#e8c468] uppercase">
              CONFIDENTIAL CASE DOSSIER // {DETECTRIX_INTRO_CONFIG.department}
            </span>
          </div>

          {/* Title Presentation (Reduced Font Size per user instruction) */}
          <div className="space-y-1 mb-3">
            <p className="detectrix-hud-font text-xs sm:text-sm text-[#e8c468]/70 tracking-[0.3em] uppercase">
              {DETECTRIX_INTRO_CONFIG.titleLine1}
            </p>
            <h1 className="detectrix-display-font text-3xl sm:text-5xl md:text-6xl font-black tracking-widest text-[#e8c468] detectrix-gold-glow uppercase leading-tight">
              {DETECTRIX_INTRO_CONFIG.titleLine2}
            </h1>
          </div>

          {/* Subtitle / Tagline */}
          <p className="detectrix-serif-font italic text-sm sm:text-base text-zinc-300 mb-6 sm:mb-8 max-w-lg mx-auto leading-relaxed">
            &ldquo;{DETECTRIX_INTRO_CONFIG.tagline}&rdquo;
          </p>

          {/* Metadata Grid (Compact, High-Density Intelligence) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left mb-8 max-w-lg mx-auto">
            <div className="bg-black/60 border border-zinc-800 p-2.5 rounded">
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                VENUE
              </span>
              <span className="text-xs sm:text-sm font-mono text-[#e8c468] font-bold">
                {DETECTRIX_INTRO_CONFIG.venue}
              </span>
            </div>
            <div className="bg-black/60 border border-zinc-800 p-2.5 rounded">
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                TIME FRAME
              </span>
              <span className="text-xs sm:text-sm font-mono text-[#e8c468] font-bold">
                {DETECTRIX_INTRO_CONFIG.duration}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-black/60 border border-zinc-800 p-2.5 rounded">
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                BOUNTY
              </span>
              <span className="text-xs sm:text-sm font-mono text-[#e8c468] font-bold">
                {DETECTRIX_INTRO_CONFIG.bounty}
              </span>
            </div>
          </div>

          {/* ====================================================
              4. THE PLAY BUTTON (Click starts 12s cowboy soundtrack & enters)
              ==================================================== */}
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Primary Big Glowing Play Button */}
            <button
              id="detectrix-play-intro-btn"
              type="button"
              onClick={handlePlayAndEnter}
              disabled={isNavigating}
              className="group relative inline-flex items-center gap-3.5 px-7 sm:px-9 py-3.5 sm:py-4 bg-[#e8c468] hover:bg-[#f3d484] text-black font-mono font-black text-sm sm:text-base tracking-widest rounded-lg shadow-[0_0_30px_rgba(232,196,104,0.5)] hover:shadow-[0_0_45px_rgba(232,196,104,0.85)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
            >
              {/* Pulsing circular Play Icon badge */}
              <span className="w-8 h-8 rounded-full bg-black text-[#e8c468] flex items-center justify-center text-sm font-bold pl-0.5 shadow-inner transition-transform group-hover:scale-110">
                ▶
              </span>

              <span className="uppercase font-bold tracking-wider">
                {isNavigating ? "ACCESSING INVESTIGATION..." : "PLAY AUDIO & OPEN CASE"}
              </span>

              {/* Pulsing Outer Glow Ring */}
              <span className="absolute -inset-1 rounded-lg bg-[#e8c468]/30 blur-sm pointer-events-none animate-pulse" />
            </button>

            {/* Audio Toggle & Help Text */}
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
              <button
                type="button"
                onClick={handleToggleAudioOnly}
                className="hover:text-[#e8c468] underline decoration-zinc-700 hover:decoration-[#e8c468] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Toggle soundtrack playback on this page"
              >
                <span>{isPlayingAudio ? "⏸ PAUSE AUDIO" : "♫ PREVIEW THEME (12s)"}</span>
              </button>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">
                [PRESS <kbd className="text-[#e8c468] bg-black/60 px-1 py-0.5 border border-zinc-800 rounded">SPACE</kbd> TO PLAY]
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. FOOTER: STATUS NOTES
          ======================================================== */}
      <footer className="relative z-30 pb-4 sm:pb-6 px-4 sm:px-8 flex items-center justify-between text-zinc-400">
        <div className="detectrix-hud-font text-[10px] sm:text-[11px] tracking-wider text-zinc-400">
          DETECTRIX 2K26 · ALL FORENSIC LOGS ACTIVE
        </div>

        <div className="detectrix-hud-font text-[10px] sm:text-[11px] tracking-wider text-[#e8c468]/60">
          AUTHORIZED INVESTIGATORS ONLY
        </div>
      </footer>

      {/* ========================================================
          6. SCOPED STYLES & FONTS (Zero external dependencies)
          ======================================================== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@1,400;1,600&family=Space+Mono:ital,wght@0,400;0,700&display=swap');

        .detectrix-display-font {
          font-family: 'Bebas Neue', 'Impact', sans-serif;
          letter-spacing: 0.12em;
        }

        .detectrix-serif-font {
          font-family: 'Playfair Display', Georgia, serif;
        }

        .detectrix-hud-font {
          font-family: 'Space Mono', 'Courier Prime', monospace;
        }

        .detectrix-gold-glow {
          color: #e8c468;
          text-shadow:
            0 0 16px rgba(232, 196, 104, 0.65),
            0 0 32px rgba(232, 196, 104, 0.35),
            0 2px 4px rgba(0, 0, 0, 0.95);
        }

        .detectrix-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
        }

        .detectrix-scanlines {
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%,
            rgba(0, 0, 0, 0.25) 50%
          );
          background-size: 100% 4px;
        }

        @keyframes kenBurnsSubtle {
          0% {
            transform: scale(1.02) translate(0, 0);
          }
          100% {
            transform: scale(1.08) translate(-1%, -1%);
          }
        }

        @keyframes soundBar {
          0%, 100% {
            height: 25%;
          }
          50% {
            height: 100%;
          }
        }

        @keyframes detectrixShutterFlash {
          0% {
            opacity: 0;
          }
          25% {
            opacity: 0.95;
            background-color: #fff8e1;
          }
          100% {
            opacity: 0;
          }
        }

        .detectrix-shutter-flash {
          animation: detectrixShutterFlash 0.40s ease-out forwards;
        }
      `}</style>
    </main>
  );
};

export default DetectiveCaseIntro;
