"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================

export const EXTERNAL_REDIRECT_LINK: string = "/";
export const DETECTRIX_MUSIC_PLAYED_KEY = "detectrix_entry_music_played";
export const DETECTRIX_INTRO_ENTERED_KEY = "detectrix_intro_entered";

/**
 * Checks if the entry music has already been played once.
 * Prevents replaying on refresh, next time, or re-entry.
 */
export const hasEntryMusicPlayed = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return (
      localStorage.getItem(DETECTRIX_MUSIC_PLAYED_KEY) === "true" ||
      sessionStorage.getItem(DETECTRIX_MUSIC_PLAYED_KEY) === "true"
    );
  } catch {
    return false;
  }
};

export const DETECTRIX_INTRO_CONFIG = {
  caseFileNumber: "CASE FILE № 2K26",
  audioSrc: "/audio/cowboy-theme.mp3",
  audioDurationMs: 12000, // Strictly 12 seconds
  coverImage: "/assets/detectrix-noir-backdrop.jpg",
};

// ============================================================================
// 2. DETECTIVE CASE INTRO COMPONENT
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

  // Persistent audio element mounted on document.body so routing preserves playback seamlessly
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
  // PLAYS ONLY ONCE: Never replays on page refresh or next visit
  const startAudioPlayback = useCallback((): boolean => {
    if (hasEntryMusicPlayed()) {
      return false;
    }

    // Immediately mark as played to prevent any subsequent trigger
    try {
      localStorage.setItem(DETECTRIX_MUSIC_PLAYED_KEY, "true");
      sessionStorage.setItem(DETECTRIX_MUSIC_PLAYED_KEY, "true");
    } catch {}

    const audio = getOrCreateAudio();
    if (!audio) return false;

    try {
      audio.currentTime = 0;
      audio.volume = 0.95;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio autoplay policy check:", err);
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

    // Audio fade-out during final 1.8 seconds of the 12s window
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
          audio.volume = 0.95;
        }
      } catch {}
      setIsPlayingAudio(false);
      if (audioFadeIntervalRef.current) clearInterval(audioFadeIntervalRef.current);
      if (audioCountdownIntervalRef.current) clearInterval(audioCountdownIntervalRef.current);
    }, DETECTRIX_INTRO_CONFIG.audioDurationMs);

    return true;
  }, [getOrCreateAudio]);

  // Click Action: Start cowboy soundtrack and seamlessly navigate to landing page
  const handleEnterCase = useCallback(() => {
    if (isNavigating) return;

    // 1. Play 12-second cowboy theme audio immediately on click (plays ONLY ONCE)
    startAudioPlayback();

    // 2. Mark intro as entered in cookie and storages so it never blocks or replays on refresh
    try {
      localStorage.setItem(DETECTRIX_INTRO_ENTERED_KEY, "true");
      sessionStorage.setItem(DETECTRIX_INTRO_ENTERED_KEY, "true");
      sessionStorage.setItem("introSeen", "true");
      document.cookie = `${DETECTRIX_INTRO_ENTERED_KEY}=true; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}

    // 3. Shutter flash effect
    setIsFlashing(true);
    setIsNavigating(true);

    // 4. Transition to portal
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

  // Quick bypass directly to portal
  const handleDirectBypass = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isNavigating) return;
    setIsFlashing(true);
    setIsNavigating(true);
    try {
      localStorage.setItem(DETECTRIX_INTRO_ENTERED_KEY, "true");
      sessionStorage.setItem(DETECTRIX_INTRO_ENTERED_KEY, "true");
      sessionStorage.setItem("introSeen", "true");
      document.cookie = `${DETECTRIX_INTRO_ENTERED_KEY}=true; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    setTimeout(() => {
      if (onEnterInvestigation) {
        onEnterInvestigation();
      } else if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
        window.location.href = redirectUrl;
      } else {
        router.push(redirectUrl);
      }
    }, 300);
  }, [isNavigating, onEnterInvestigation, redirectUrl, router]);

  // Keyboard support: Space or Enter to enter case, Escape to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleEnterCase();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleDirectBypass();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDirectBypass, handleEnterCase]);

  // Clean-up countdown timer on unmount
  useEffect(() => {
    return () => {
      if (audioCountdownIntervalRef.current) clearInterval(audioCountdownIntervalRef.current);
    };
  }, []);

  return (
    <main
      id="detectrix-intro-container"
      className="relative w-screen h-screen overflow-hidden bg-black text-[#f4ecd8] select-none flex items-center justify-center cursor-pointer"
      style={{ isolation: "isolate" }}
      aria-label="Detective Case File Introduction - DETECTRIX"
      onClick={handleEnterCase}
    >
      {/* ========================================================
          1. AUTHENTIC NOIR DETECTIVE BACKDROP (FROM REFERENCE IMAGE)
          ======================================================== */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src={DETECTRIX_INTRO_CONFIG.coverImage}
          alt="Atmospheric Detective Noir Room with Desk Lamp"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-[1.01] transition-transform duration-1000 ease-out"
        />

        {/* Ambient Dark Vignette to focus attention on center elements */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.55) 70%, rgba(0, 0, 0, 0.92) 100%)",
          }}
        />
      </div>

      {/* Camera Shutter Flash on Entry */}
      {isFlashing && (
        <div
          className="detectrix-shutter-flash absolute inset-0 z-50 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Cinematic 2px Letterbox Edge Lines */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0c0814] z-40 border-b border-[#e8c468]/30" />
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0c0814] z-40 border-t border-[#e8c468]/30" />

      {/* Film Grain & Scanlines overlay for vintage noir depth */}
      <div className="detectrix-scanlines absolute inset-0 pointer-events-none z-10 opacity-20" />
      <div className="detectrix-grain absolute inset-0 pointer-events-none z-10 opacity-15" />

      {/* ========================================================
          2. CORNER WATERMARKS (AS IN REFERENCE IMAGE)
          ======================================================== */}
      {/* Top-Left: Faint Case File Number */}
      <div className="absolute top-4 left-4 sm:top-7 sm:left-8 z-30 pointer-events-none flex items-center gap-2">
        <span className="detectrix-mono-font text-[10px] sm:text-xs tracking-[0.25em] text-[#e8c468]/40 font-semibold uppercase">
          CASE FILE № 2K26
        </span>
      </div>

      {/* Top-Right: Recording Indicator & HUD controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30 flex items-center gap-3">
        {/* Faint Red REC indicator (matching reference image) */}
        <div className="hidden sm:flex items-center gap-1.5 mr-2 pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
          <span className="detectrix-mono-font text-[10px] tracking-[0.2em] text-red-500/80 font-bold">
            REC
          </span>
        </div>

        {/* Audio Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono tracking-wider transition-all backdrop-blur-md ${
            isPlayingAudio
              ? "bg-[#e8c468]/20 border-[#e8c468] text-[#e8c468] shadow-[0_0_15px_rgba(232,196,104,0.4)]"
              : "bg-black/70 border-zinc-700/80 text-zinc-300"
          }`}
        >
          {isPlayingAudio ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#e8c468] animate-pulse" />
              <span>THEME [{audioSecondsRemaining}s]</span>
              <span className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 bg-[#e8c468] animate-[soundBar_0.8s_ease-in-out_infinite_0.1s] h-full" />
                <span className="w-0.5 bg-[#e8c468] animate-[soundBar_0.8s_ease-in-out_infinite_0.3s] h-2/3" />
                <span className="w-0.5 bg-[#e8c468] animate-[soundBar_0.8s_ease-in-out_infinite_0.5s] h-4/5" />
              </span>
            </>
          ) : (
            <>
              <span className="text-[#e8c468]">♫</span>
              <span>12s THEME</span>
            </>
          )}
        </div>

        {/* Direct Bypass Button */}
        <button
          type="button"
          onClick={handleDirectBypass}
          className="detectrix-mono-font text-[11px] sm:text-xs font-bold tracking-widest text-[#e8c468]/90 hover:text-[#e8c468] uppercase px-3 py-1.5 bg-black/75 hover:bg-black/95 border border-[#e8c468]/40 hover:border-[#e8c468] rounded-md transition-all cursor-pointer shadow-lg backdrop-blur-md"
          title="Skip to portal immediately"
        >
          SKIP »
        </button>
      </div>

      {/* ========================================================
          3. MAIN CENTERPIECE: CASE FILE, DETECTRIX & OPEN THE CASE
          ======================================================== */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-6 sm:space-y-7 md:space-y-8">
        {/* Top Centered Header: CASE FILE № 2K26 */}
        <div className="detectrix-center-tag">
          <p className="detectrix-mono-font text-xs sm:text-sm md:text-base font-bold tracking-[0.38em] text-[#d6b063] uppercase select-none detectrix-amber-subtle-glow">
            CASE FILE&nbsp;&nbsp;№&nbsp;&nbsp;2 K 2 6
          </p>
        </div>

        {/* Center Title: DETECTRIX (Reduced Font Size & Stencil Aesthetics) */}
        <div className="detectrix-title-wrap py-1">
          <h1
            id="detectrix-main-title"
            className="detectrix-stencil-font text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-[0.16em] sm:tracking-[0.22em] text-[#faefe0] select-none detectrix-gold-glow leading-none"
          >
            DETECTRIX
          </h1>
        </div>

        {/* Interactive Button: OPEN THE CASE */}
        <div className="pt-2 sm:pt-3">
          <button
            id="detectrix-open-case-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEnterCase();
            }}
            disabled={isNavigating}
            className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-11 py-3 sm:py-3.5 rounded-md bg-black/65 hover:bg-black/85 border border-[#e8c468]/80 hover:border-[#ffe28a] shadow-[0_0_20px_rgba(232,196,104,0.25)] hover:shadow-[0_0_35px_rgba(232,196,104,0.65)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer backdrop-blur-md"
            aria-label="Open the case and play audio"
          >
            {/* Play Triangle Icon */}
            <span className="text-[#e8c468] text-xs sm:text-sm group-hover:scale-110 transition-transform">
              ▶
            </span>

            {/* Button Label */}
            <span className="detectrix-mono-font text-xs sm:text-sm md:text-base font-bold tracking-[0.24em] text-[#f6ecd0] group-hover:text-[#fff4d6] uppercase">
              {isNavigating ? "ACCESSING CASE..." : "OPEN THE CASE"}
            </span>

            {/* Shimmer line passing through button on hover */}
            <span className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
              <span className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]" />
            </span>
          </button>
        </div>

        {/* Subtext Below Button: SOUND ON · CLICK ANYWHERE TO BEGIN */}
        <div className="pt-1">
          <p className="detectrix-mono-font text-[10px] sm:text-xs text-[#d6b063]/70 tracking-[0.25em] uppercase select-none">
            SOUND ON&nbsp;&nbsp;·&nbsp;&nbsp;CLICK ANYWHERE TO BEGIN
          </p>
        </div>
      </div>

      {/* ========================================================
          4. SCOPED STYLES, GOOGLE FONTS & KEYFRAMES
          ======================================================== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

        .detectrix-stencil-font {
          font-family: 'Black Ops One', 'Impact', sans-serif;
        }

        .detectrix-mono-font {
          font-family: 'Space Mono', 'Courier Prime', monospace;
        }

        .detectrix-gold-glow {
          text-shadow:
            0 0 18px rgba(232, 196, 104, 0.75),
            0 0 38px rgba(232, 196, 104, 0.4),
            0 2px 4px rgba(0, 0, 0, 0.95);
        }

        .detectrix-amber-subtle-glow {
          text-shadow:
            0 0 10px rgba(232, 196, 104, 0.45),
            0 1px 2px rgba(0, 0, 0, 0.9);
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

        @keyframes soundBar {
          0%, 100% {
            height: 25%;
          }
          50% {
            height: 100%;
          }
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
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
