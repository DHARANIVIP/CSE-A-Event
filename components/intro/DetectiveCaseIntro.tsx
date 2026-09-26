"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

// ============================================================================
// 1. CONFIGURATION & CONSTANTS (Easily editable for future hackathons / links)
// ============================================================================

/**
 * Configure your external or internal redirect link here.
 * Defaults to the main landing page ("/"), but can be set to any internal or external URL
 * (e.g. "https://...", "/case", "/enter").
 */
export const EXTERNAL_REDIRECT_LINK: string = "/";

export interface CaseExhibit {
  number: string;
  subtitle: string;
  propDescription: string;
  revealText: string;
  tagline: string;
  backgroundImage: string;
  isMonogramMorph?: boolean;
}

export const DETECTRIX_INTRO_CONFIG = {
  caseFileNumber: "CASE FILE № 2K26",
  titleLine1: "THE",
  titleLine2: "DETECTRIX FILE",
  audioSrc: "/audio/cowboy-theme.mp3",
  exhibits: [
    {
      number: "01",
      subtitle: "THE CASE NAME",
      propDescription: "vintage analog alarm clock on a desk, blurred books behind",
      revealText: "DETECTRIX",
      tagline: "Every case begins with a name.",
      backgroundImage: "/assets/intro-scene-1.jpg",
    },
    {
      number: "02",
      subtitle: "SCENE OF THE CRIME",
      propDescription: "crime-board collage: crumpled notebook pages, burnt/torn paper, red string, newspaper clippings",
      revealText: "KSRCE",
      tagline: "The place it all goes down.",
      backgroundImage: "/assets/intro-scene-2.jpg",
      isMonogramMorph: true,
    },
    {
      number: "03",
      subtitle: "THE TIME FRAME",
      propDescription: "old radio/boombox on a table next to a drink glass",
      revealText: "6HRS MYSTREY WORLD",
      tagline: "One night. No second chances.",
      backgroundImage: "/assets/intro-scene-3.jpg",
    },
    {
      number: "04",
      subtitle: "THE BOUNTY",
      propDescription: "clock + an ornate wooden prize box",
      revealText: "SPECIAL GIFTS !!!!",
      tagline: "Motive enough for anyone.",
      backgroundImage: "/assets/intro-scene-4.jpg",
    },
    {
      number: "05",
      subtitle: "THE BACKER",
      propDescription: "dim tabletop with scattered mystery objects, low light",
      revealText: '"CSE"',
      tagline: "Someone's pulling the strings.",
      backgroundImage: "/assets/intro-scene-5.jpg",
    },
  ] as CaseExhibit[],
  finalCta: {
    tag: "● CASE 2K26 — SOLVED",
    headline: "CASE OPEN",
    buttonText: "ENTER THE INVESTIGATION →",
    replayText: "↺ REPLAY THE CASE",
    backgroundImage: "/assets/intro-scene-2.jpg",
  },
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
  // Scene index: 0 = Title Card, 1..5 = Exhibits, 6 = Final CTA Screen
  const [currentScene, setCurrentScene] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [monogramMorphed, setMonogramMorphed] = useState<boolean>(false);
  const [taglineVisible, setTaglineVisible] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const exhibits = DETECTRIX_INTRO_CONFIG.exhibits;
  const totalExhibits = exhibits.length; // 5

  // Initialize or retrieve persistent audio element
  const getOrCreateAudio = useCallback((): HTMLAudioElement | null => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      let audio = document.getElementById("detectrix-intro-theme-audio") as HTMLAudioElement;
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "detectrix-intro-theme-audio";
        audio.src = DETECTRIX_INTRO_CONFIG.audioSrc;
        audio.preload = "auto";
        audio.loop = true;
        document.body.appendChild(audio);
      }
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  // Jump to specific scene
  const goToScene = useCallback((nextIndex: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTaglineVisible(false);
    setMonogramMorphed(false);
    setCurrentScene(nextIndex);
  }, []);

  // Exit trigger: screen flash + start music on user gesture + redirect
  const handleExitFlow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 1. Trigger Screen-Flash Shutter Wipe
    setIsFlashing(true);

    // 2. Start Theme Music at exact click (User Gesture for browser autoplay compliance)
    const audio = getOrCreateAudio();
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.volume = 0.8;
        audio.play().catch(() => {
          // Autoplay fallback
        });
      } catch {}
    }

    // 3. Mark intro seen in sessionStorage
    try {
      sessionStorage.setItem("introSeen", "true");
    } catch {}

    // 4. Redirect after flash completes (~400ms)
    setTimeout(() => {
      if (onEnterInvestigation) {
        onEnterInvestigation();
      } else {
        window.location.href = redirectUrl;
      }
    }, 420);
  }, [getOrCreateAudio, onEnterInvestigation, redirectUrl]);

  // Restart sequence from Scene 0
  const handleReplay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    goToScene(0);
  }, [goToScene]);

  // Check if intro has already been seen in this session (skip to Scene 6)
  useEffect(() => {
    try {
      if (sessionStorage.getItem("introSeen") === "true") {
        setCurrentScene(6);
      }
    } catch {}
  }, []);

  // Auto-advance scene timer loop
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Punch text in first, then tagline fades in a beat later
    const taglineTimer = setTimeout(() => {
      setTaglineVisible(true);
    }, 380);

    // Slide 2 monogram-to-text morph animation (holds ~0.5s then morphs)
    if (currentScene === 2) {
      const morphTimer = setTimeout(() => {
        setMonogramMorphed(true);
      }, 500);
      return () => {
        clearTimeout(taglineTimer);
        clearTimeout(morphTimer);
      };
    }

    // Scene durations
    let duration = 3000;
    if (currentScene === 0) {
      duration = 3200; // Title card ~3.2s
    } else if (currentScene >= 1 && currentScene <= 5) {
      duration = 2800; // Exhibits ~2.8s each
    } else if (currentScene === 6) {
      // Scene 6: holds until user clicks
      return () => {
        clearTimeout(taglineTimer);
      };
    }

    timerRef.current = setTimeout(() => {
      if (currentScene < 6) {
        goToScene(currentScene + 1);
      }
    }, duration);

    return () => {
      clearTimeout(taglineTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentScene, goToScene]);

  // Keyboard navigation (Space/Right Arrow = next, Escape = skip)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleExitFlow();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        if (currentScene < 6) {
          goToScene(currentScene + 1);
        } else {
          handleExitFlow();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentScene, goToScene, handleExitFlow]);

  // Current background determination
  let currentBgImage = "/assets/intro-scene-0.jpg";
  if (currentScene === 0) {
    currentBgImage = "/assets/intro-scene-0.jpg";
  } else if (currentScene >= 1 && currentScene <= totalExhibits) {
    currentBgImage = exhibits[currentScene - 1].backgroundImage;
  } else if (currentScene === 6) {
    currentBgImage = DETECTRIX_INTRO_CONFIG.finalCta.backgroundImage;
  }

  // Active exhibit data
  const activeExhibit: CaseExhibit | null =
    currentScene >= 1 && currentScene <= totalExhibits ? exhibits[currentScene - 1] : null;

  return (
    <div
      onClick={() => {
        if (currentScene < 6) {
          goToScene(currentScene + 1);
        }
      }}
      className="detectrix-intro-root fixed inset-0 z-[9999] overflow-hidden bg-black select-none cursor-pointer flex flex-col justify-between"
      aria-label="Detective Case File Intro Sequence"
    >
      {/* ========================================================
          1. CINEMATIC LETTERBOX BARS (Top & Bottom)
          ======================================================== */}
      <div className="absolute top-0 inset-x-0 h-4 sm:h-5 bg-[#09050c] z-40 border-b border-[#241a24]/50 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-4 sm:h-5 bg-[#09050c] z-40 border-t border-[#241a24]/50 pointer-events-none" />

      {/* ========================================================
          2. FULL-BLEED BACKGROUND WITH KEN-BURNS SLOW ZOOM
          ======================================================== */}
      <div key={`bg-${currentScene}`} className="absolute inset-0 overflow-hidden -z-10">
        <div className="relative w-full h-full detectrix-ken-burns">
          <Image
            src={currentBgImage}
            alt="Detective Case File Background"
            fill
            priority
            sizes="100vw"
            className={`object-cover object-center filter brightness-[0.80] contrast-[1.10] saturate-[0.85] ${
              currentScene === 6 ? "brightness-[0.40] contrast-[1.20]" : ""
            }`}
          />
        </div>
      </div>

      {/* ========================================================
          3. NOIR POST-PROCESSING ATMOSPHERIC LAYERS
          Near-black background, warm amber/sepia highlights,
          heavy vignette, film grain, scan-lines, top light-leak
          ======================================================== */}
      {/* Heavy Perimeter Vignette */}
      <div
        className="absolute inset-0 pointer-events-none -z-5"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10, 7, 5, 0.20) 25%, rgba(12, 8, 6, 0.75) 65%, rgba(4, 3, 2, 0.98) 100%)",
        }}
      />

      {/* Warm Amber / Sepia Atmospheric Wash */}
      <div
        className="absolute inset-0 pointer-events-none -z-5 opacity-40 mix-blend-color"
        style={{
          background: "linear-gradient(135deg, #e8c468 0%, #ab7b49 50%, #4a2d18 100%)",
        }}
      />

      {/* Soft Diagonal Light Leak Sweeping Across Top of Frame */}
      <div
        className="absolute top-0 inset-x-0 h-[45vh] pointer-events-none -z-5 opacity-35"
        style={{
          background:
            "linear-gradient(145deg, rgba(240, 200, 120, 0.22) 0%, rgba(220, 160, 80, 0.08) 35%, transparent 60%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Film Grain Texture */}
      <div className="absolute inset-0 detectrix-grain pointer-events-none -z-4 opacity-35" />

      {/* Faint Horizontal Scan-Lines */}
      <div className="absolute inset-0 detectrix-scanlines pointer-events-none -z-4 opacity-25" />

      {/* ========================================================
          4. PERSISTENT HUD OVERLAY (Every Screen)
          ======================================================== */}
      <header className="relative z-30 pt-6 sm:pt-7 px-5 sm:px-8 flex items-center justify-between pointer-events-none">
        {/* Top-Left: CASE FILE № 2K26 */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#e8c468] rounded-full shadow-[0_0_8px_#e8c468]" />
          <span className="detectrix-hud-font text-[11px] sm:text-xs tracking-widest text-[#e8c468]/90 font-bold uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {DETECTRIX_INTRO_CONFIG.caseFileNumber}
          </span>
        </div>

        {/* Top-Right: Pulsing Red REC Indicator (1s cycle) */}
        <div className="flex items-center gap-2 detectrix-hud-font text-[11px] sm:text-xs tracking-widest text-red-500 font-bold uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_#ef4444]" />
          <span>REC</span>
        </div>
      </header>

      {/* ========================================================
          5. MAIN SCENE CONTENT STAGE
          ======================================================== */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 max-w-5xl mx-auto w-full">
        {/* SCENE 0: Opening Title Card (~3s) */}
        {currentScene === 0 && (
          <div key="scene-0" className="space-y-4 sm:space-y-6">
            <div className="detectrix-vhs-reveal">
              <span className="block detectrix-hud-font text-xs sm:text-sm tracking-[0.35em] text-[#e8c468]/80 font-bold uppercase mb-2">
                CLASSIFIED CASE FILE
              </span>
              <h1 className="detectrix-display-font text-5xl sm:text-7xl md:text-8xl lg:text-9xl detectrix-gold-glow-lg font-black tracking-wider leading-none">
                {DETECTRIX_INTRO_CONFIG.titleLine1} {DETECTRIX_INTRO_CONFIG.titleLine2}
              </h1>
            </div>
            <p className="detectrix-caption-font text-amber-100/80 text-sm sm:text-base md:text-lg italic tracking-wide max-w-md mx-auto drop-shadow-md">
              Every mystery leaves a trail.
            </p>
          </div>
        )}

        {/* SCENES 1–5: Exhibit Sequence */}
        {activeExhibit && (
          <div key={`scene-${currentScene}`} className="w-full space-y-4 sm:space-y-6">
            {/* Small Centered Monospace Caption Stack */}
            <div className="space-y-1.5">
              <div className="inline-block px-3 py-1 bg-black/65 border border-[#e8c468]/45 rounded-sm shadow-sm backdrop-blur-sm">
                <span className="detectrix-hud-font text-xs sm:text-sm tracking-[0.25em] text-[#e8c468] font-bold uppercase">
                  EXHIBIT № {activeExhibit.number}
                </span>
              </div>
              <h2 className="detectrix-hud-font text-xs sm:text-sm tracking-[0.2em] text-[#e8c468]/80 font-semibold uppercase">
                {activeExhibit.subtitle}
              </h2>
            </div>

            {/* Big Display-Font Word / Phrase (Glow-Pulse + Scale-up) */}
            <div className="min-h-[100px] sm:min-h-[140px] md:min-h-[180px] flex items-center justify-center">
              {activeExhibit.isMonogramMorph ? (
                // Exhibit 02: Monogram icon fades in ~0.5s then morphs to KSRCE
                <div className="relative flex items-center justify-center">
                  {!monogramMorphed ? (
                    <div className="w-20 h-20 sm:w-28 sm:h-28 border-2 border-[#e8c468] rotate-45 flex items-center justify-center bg-black/75 shadow-[0_0_30px_rgba(232,196,104,0.6)] animate-pulse">
                      <span className="-rotate-45 detectrix-display-font text-3xl sm:text-4xl text-[#e8c468] font-black">
                        K
                      </span>
                    </div>
                  ) : (
                    <div className="detectrix-punch-in">
                      <h3 className="detectrix-display-font text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] detectrix-gold-glow-lg font-black tracking-wider leading-none">
                        {activeExhibit.revealText}
                      </h3>
                    </div>
                  )}
                </div>
              ) : (
                <div className="detectrix-punch-in">
                  <h3 className="detectrix-display-font text-5xl sm:text-7xl md:text-8xl lg:text-[9.5rem] detectrix-gold-glow-lg font-black tracking-wider leading-none">
                    {activeExhibit.revealText}
                  </h3>
                </div>
              )}
            </div>

            {/* Elegant Italic Serif Tagline (fades in a beat later) */}
            <div
              className={`transition-all duration-700 ease-out transform ${
                taglineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <p className="detectrix-caption-font text-amber-100/90 text-base sm:text-xl md:text-2xl italic tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-lg mx-auto">
                &ldquo;{activeExhibit.tagline}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* SCENE 6: Final CTA Screen (The LAST screen of this build) */}
        {currentScene === 6 && (
          <div key="scene-6" className="space-y-6 sm:space-y-8 detectrix-vhs-reveal">
            {/* Small red tag line with bullet */}
            <div className="flex items-center justify-center gap-2">
              <span className="detectrix-hud-font text-xs sm:text-sm tracking-[0.25em] text-red-500 font-bold uppercase drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">
                {DETECTRIX_INTRO_CONFIG.finalCta.tag}
              </span>
            </div>

            {/* Giant glowing display headline: CASE OPEN */}
            <h1 className="detectrix-display-font text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] detectrix-gold-glow-lg font-black tracking-wider leading-none">
              {DETECTRIX_INTRO_CONFIG.finalCta.headline}
            </h1>

            {/* Bordered, glowing gold outline button: ENTER THE INVESTIGATION → */}
            <div className="pt-2 sm:pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExitFlow();
                }}
                className="group relative inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-5 border-2 border-[#e8c468] bg-black/80 hover:bg-[#e8c468] text-[#e8c468] hover:text-[#120d08] detectrix-display-font text-2xl sm:text-3xl md:text-4xl tracking-wider rounded transition-all duration-300 shadow-[0_0_24px_rgba(232,196,104,0.45)] hover:shadow-[0_0_48px_rgba(232,196,104,0.85)] hover:scale-[1.03] cursor-pointer"
              >
                <span>{DETECTRIX_INTRO_CONFIG.finalCta.buttonText}</span>
              </button>
            </div>

            {/* Small muted link: REPLAY THE CASE */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleReplay}
                className="detectrix-hud-font text-xs sm:text-sm text-[#e8c468]/60 hover:text-[#e8c468] tracking-widest uppercase underline decoration-1 hover:decoration-[#e8c468] transition-colors cursor-pointer"
              >
                {DETECTRIX_INTRO_CONFIG.finalCta.replayText}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          6. HUD FOOTER & PROGRESS INDICATORS
          ======================================================== */}
      <footer className="relative z-30 pb-6 sm:pb-7 px-5 sm:px-8 flex items-center justify-between">
        {/* Left: Keyboard Navigation Hint */}
        <div className="hidden sm:block">
          <span className="detectrix-hud-font text-[10px] text-[#e8c468]/40 tracking-wider">
            [CLICK / SPACE] ADVANCE · [ESC] SKIP
          </span>
        </div>

        {/* Center: 5 Small Dot Indicators showing progress */}
        <div className="flex items-center gap-2.5">
          {exhibits.map((_, idx) => {
            const exhibitIndex = idx + 1;
            const isActive = currentScene === exhibitIndex;
            const isPassed = currentScene > exhibitIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToScene(exhibitIndex);
                }}
                title={`Exhibit 0${idx + 1}`}
                aria-label={`Jump to Exhibit 0${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? "w-3 h-3 bg-[#e8c468] shadow-[0_0_12px_#e8c468]"
                    : isPassed
                    ? "w-2.5 h-2.5 bg-[#e8c468]/50"
                    : "w-2.5 h-2.5 border border-[#e8c468]/40 bg-transparent"
                }`}
              />
            );
          })}
        </div>

        {/* Right: SKIP INTRO » Button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleExitFlow();
            }}
            className="detectrix-hud-font text-xs sm:text-sm font-bold tracking-widest text-[#e8c468]/85 hover:text-[#e8c468] hover:drop-shadow-[0_0_8px_#e8c468] uppercase transition-all px-3 py-1.5 bg-black/50 hover:bg-black/85 border border-[#e8c468]/35 hover:border-[#e8c468] rounded-sm cursor-pointer"
          >
            SKIP INTRO »
          </button>
        </div>
      </footer>

      {/* ========================================================
          7. SHUTTER FLASH OVERLAY (Triggers on Exit Click)
          ======================================================== */}
      {isFlashing && (
        <div
          className="fixed inset-0 z-50 pointer-events-none detectrix-shutter-flash"
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          8. SELF-CONTAINED STYLES & FONTS
          Guarantees zero dependency on altering existing website styles
          ======================================================== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@1,400;1,600&family=Space+Mono:ital,wght@0,400;0,700&display=swap');

        .detectrix-display-font {
          font-family: 'Bebas Neue', 'Graduate', 'Impact', sans-serif;
          letter-spacing: 0.05em;
        }

        .detectrix-caption-font {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
        }

        .detectrix-hud-font {
          font-family: 'Space Mono', 'Courier Prime', monospace;
        }

        .detectrix-gold-glow-lg {
          color: #e8c468;
          text-shadow:
            0 0 24px rgba(232, 196, 104, 0.7),
            0 0 48px rgba(232, 196, 104, 0.4),
            0 0 72px rgba(232, 196, 104, 0.25),
            0 4px 8px rgba(0, 0, 0, 0.95);
        }

        .detectrix-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
        }

        .detectrix-scanlines {
          background: linear-gradient(
            rgba(18, 16, 14, 0) 50%,
            rgba(0, 0, 0, 0.35) 50%
          );
          background-size: 100% 4px;
        }

        @keyframes detectrixKenBurns {
          0% {
            transform: scale(1.0);
          }
          100% {
            transform: scale(1.08);
          }
        }

        .detectrix-ken-burns {
          animation: detectrixKenBurns 3.2s ease-out forwards;
        }

        @keyframes detectrixVhsReveal {
          0% {
            filter: blur(10px);
            opacity: 0;
            transform: scale(0.96) translate(-4px, 2px);
            text-shadow: -3px 0 rgba(255, 50, 50, 0.8), 3px 0 rgba(0, 200, 255, 0.8);
          }
          30% {
            filter: blur(4px);
            opacity: 0.85;
            transform: scale(0.98) translate(2px, -1px);
            text-shadow: 2px 0 rgba(255, 50, 50, 0.6), -2px 0 rgba(0, 200, 255, 0.6);
          }
          65% {
            filter: blur(1px);
            opacity: 0.95;
            transform: scale(1.0) translate(-1px, 0);
            text-shadow: -1px 0 rgba(255, 50, 50, 0.3), 1px 0 rgba(0, 200, 255, 0.3);
          }
          100% {
            filter: blur(0px);
            opacity: 1;
            transform: scale(1.0) translate(0, 0);
            text-shadow: 0 0 24px rgba(232, 196, 104, 0.6);
          }
        }

        .detectrix-vhs-reveal {
          animation: detectrixVhsReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes detectrixPunchGlow {
          0% {
            transform: scale(0.88);
            opacity: 0;
            filter: brightness(1.8) drop-shadow(0 0 30px rgba(232, 196, 104, 0.9));
          }
          60% {
            transform: scale(1.03);
            opacity: 1;
            filter: brightness(1.2) drop-shadow(0 0 20px rgba(232, 196, 104, 0.6));
          }
          100% {
            transform: scale(1.0);
            opacity: 1;
            filter: brightness(1.0) drop-shadow(0 0 14px rgba(232, 196, 104, 0.45));
          }
        }

        .detectrix-punch-in {
          animation: detectrixPunchGlow 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes detectrixShutterFlash {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 0.95;
            background-color: #fff9e6;
          }
          100% {
            opacity: 0;
          }
        }

        .detectrix-shutter-flash {
          animation: detectrixShutterFlash 0.42s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DetectiveCaseIntro;
