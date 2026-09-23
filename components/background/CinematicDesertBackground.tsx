"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { desertAudio } from "../sound/DesertAudioAmbience";

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  wobble: number;
  wobbleSpeed: number;
}

interface SandPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
}

interface SandTrackSegment {
  x: number;
  y: number;
  width: number;
  alpha: number;
}

export const CinematicDesertBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hazeActive, setHazeActive] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [isCameraPaused, setIsCameraPaused] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Sync audio state with desertAudio singleton
  useEffect(() => {
    setIsMounted(true);
    setIsAudioMuted(desertAudio.getIsMuted());
    const unsubscribe = desertAudio.subscribe((muted) => {
      setIsAudioMuted(muted);
    });

    // Dissolve dust haze over 4 seconds
    const timer = setTimeout(() => {
      setHazeActive(false);
    }, 4200);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      desertAudio.stop();
    };
  }, []);

  const toggleSound = useCallback(() => {
    const newMuted = desertAudio.toggleMute();
    setIsAudioMuted(newMuted);
  }, []);

  // Main Canvas 30fps animation loop for dust, rolling stone ball, tracks, and tumbleweed
  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // 1. Initialize Volumetric Desert Dust Particles
    const dustCount = width < 768 ? 35 : 70;
    const dustParticles: DustParticle[] = [];
    for (let i = 0; i < dustCount; i++) {
      dustParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0.25 + Math.random() * 0.75, // Wind pushing gently left to right
        vy: (Math.random() - 0.45) * 0.35,
        size: 0.8 + Math.random() * 2.2,
        baseAlpha: 0.15 + Math.random() * 0.45,
        alpha: 0.2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.025,
      });
    }

    // 2. Rolling Stone Ball State
    const ballRadius = width < 768 ? 24 : 34;
    let ballX = -ballRadius * 2;
    const groundY = height * 0.89; // Low ground line in shallow depth of field
    let ballAngle = 0;
    const ballSpeed = 1.05; // steady slow roll
    let lastAudioStep = 0;

    // Track trails and dust puffs
    const tracks: SandTrackSegment[] = [];
    const sandPuffs: SandPuff[] = [];
    let frameCounter = 0;

    // 3. Tumbleweed State
    let tumbleX = width + 80;
    let tumbleY = height * 0.82;
    let tumbleAngle = 0;
    let tumbleSpeed = 1.6;
    let tumbleBounce = 0;
    const tumbleRadius = width < 768 ? 20 : 28;

    // 4. Crater / Rock details for the 3D rotating stone ball (spherical coordinates)
    const stoneDetails = [
      { u: 0.0, v: 0.15, r: ballRadius * 0.22, depth: 0.35 },
      { u: 0.9, v: -0.3, r: ballRadius * 0.18, depth: 0.4 },
      { u: 2.1, v: 0.4, r: ballRadius * 0.25, depth: 0.3 },
      { u: 3.4, v: -0.15, r: ballRadius * 0.19, depth: 0.38 },
      { u: 4.6, v: 0.2, r: ballRadius * 0.23, depth: 0.42 },
      { u: 5.5, v: -0.35, r: ballRadius * 0.16, depth: 0.35 },
    ];

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      frameCounter++;

      ctx.clearRect(0, 0, width, height);

      // --- LAYER A: Floating Sand & Volumetric Dust Motes ---
      for (let i = 0; i < dustParticles.length; i++) {
        const p = dustParticles[i];
        p.wobble += p.wobbleSpeed;
        p.x += p.vx * (1 + Math.sin(p.wobble) * 0.3);
        p.y += p.vy + Math.cos(p.wobble) * 0.2;

        if (p.x > width + 20) p.x = -20;
        if (p.y > height + 20) p.y = -20;
        if (p.y < -20) p.y = height + 20;

        const currentAlpha = p.baseAlpha * (0.65 + Math.sin(p.wobble) * 0.35);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Golden sunlit desert sand motes
        ctx.fillStyle = `rgba(245, 218, 168, ${currentAlpha.toFixed(3)})`;
        ctx.shadowColor = "rgba(255, 210, 140, 0.4)";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // --- LAYER B: Midground Tumbleweed ---
      tumbleX -= tumbleSpeed;
      tumbleAngle -= 0.035;
      tumbleBounce += 0.055;
      const currentTumbleY = tumbleY - Math.abs(Math.sin(tumbleBounce)) * 22;

      // Draw faint tumbleweed shadow on sand
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        tumbleX,
        groundY - 10,
        tumbleRadius * 0.9,
        tumbleRadius * 0.28,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(40, 22, 12, 0.18)";
      ctx.fill();

      // Draw tumbleweed branching fibrous sphere
      ctx.translate(tumbleX, currentTumbleY);
      ctx.rotate(tumbleAngle);
      ctx.strokeStyle = "rgba(110, 80, 52, 0.65)";
      ctx.lineWidth = 1.4;

      for (let j = 0; j < 6; j++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, tumbleRadius, tumbleRadius * 0.55, (j * Math.PI) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Reset tumbleweed when past screen
      if (tumbleX < -tumbleRadius * 3) {
        tumbleX = width + 100 + Math.random() * 200;
        tumbleSpeed = 1.3 + Math.random() * 0.7;
      }

      // --- LAYER C: Sand Groove Track Behind Rolling Stone Ball ---
      ballX += ballSpeed;
      ballAngle += ballSpeed / ballRadius;

      // Add track segment every 5 frames
      if (frameCounter % 4 === 0 && ballX > -ballRadius && ballX < width + ballRadius * 2) {
        tracks.push({
          x: ballX - ballRadius * 0.1,
          y: groundY + ballRadius * 0.82,
          width: ballRadius * 0.9,
          alpha: 0.38,
        });
        if (tracks.length > 180) {
          tracks.shift();
        }
      }

      // Draw sand track impressions
      for (let i = 0; i < tracks.length; i++) {
        const tr = tracks[i];
        tr.alpha *= 0.9985; // slowly get covered by drifting desert sand
        if (tr.alpha > 0.02) {
          ctx.beginPath();
          ctx.ellipse(tr.x, tr.y, tr.width * 0.5, 3.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(60, 36, 18, ${tr.alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      // --- LAYER D: Sand Dust Puffs from the Rolling Ball ---
      if (frameCounter % 9 === 0 && ballX > 0 && ballX < width) {
        sandPuffs.push({
          x: ballX - ballRadius * 0.6,
          y: groundY + ballRadius * 0.75,
          vx: -(0.3 + Math.random() * 0.4),
          vy: -(0.2 + Math.random() * 0.3),
          size: 2.5 + Math.random() * 4,
          alpha: 0.35,
          maxLife: 40 + Math.random() * 25,
          life: 0,
        });

        // Procedural audio step
        if (now - lastAudioStep > 600) {
          desertAudio.playRollingStoneStep();
          lastAudioStep = now;
        }
      }

      // Render and update sand puffs
      for (let i = sandPuffs.length - 1; i >= 0; i--) {
        const puff = sandPuffs[i];
        puff.life++;
        puff.x += puff.vx;
        puff.y += puff.vy;
        puff.size += 0.18;
        const progress = puff.life / puff.maxLife;
        const currentAlpha = puff.alpha * (1 - progress);

        if (progress >= 1) {
          sandPuffs.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(215, 185, 142, ${currentAlpha.toFixed(3)})`;
        ctx.fill();
      }

      // --- LAYER E: Ultra-Realistic Sand-Textured Stone Ball ---
      const ballCenterY = groundY;

      // 1. Soft contact ambient occlusion shadow on desert floor
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        ballX + ballRadius * 0.15,
        ballCenterY + ballRadius * 0.88,
        ballRadius * 1.15,
        ballRadius * 0.32,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(22, 12, 6, 0.52)";
      ctx.filter = "blur(3px)";
      ctx.fill();
      ctx.restore();

      // 2. Stone Sphere Base with Spherical 3D Shading
      ctx.save();
      ctx.beginPath();
      ctx.arc(ballX, ballCenterY, ballRadius, 0, Math.PI * 2);
      ctx.clip();

      // Radial sunlight gradient coming from top-left (saloon sun flare)
      const grad = ctx.createRadialGradient(
        ballX - ballRadius * 0.38,
        ballCenterY - ballRadius * 0.38,
        ballRadius * 0.08,
        ballX,
        ballCenterY,
        ballRadius
      );
      grad.addColorStop(0.0, "#fff5dd"); // Intense warm desert specular glint
      grad.addColorStop(0.2, "#e3bc88"); // Sunlit desert sandstone
      grad.addColorStop(0.55, "#ab7b49"); // Weathered stone midtone
      grad.addColorStop(0.82, "#684523"); // Core shadow
      grad.addColorStop(1.0, "#2a180b"); // Dark rim and ambient occlusion
      ctx.fillStyle = grad;
      ctx.fillRect(ballX - ballRadius, ballCenterY - ballRadius, ballRadius * 2, ballRadius * 2);

      // 3. Sandstone rough grain texture flecks
      ctx.fillStyle = "rgba(45, 25, 12, 0.35)";
      for (let s = 0; s < 14; s++) {
        const sx = ballX + Math.sin(s * 1.7) * (ballRadius * 0.7);
        const sy = ballCenterY + Math.cos(s * 2.3) * (ballRadius * 0.7);
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // 4. Realistic 3D rotating surface craters / indentations
      for (let k = 0; k < stoneDetails.length; k++) {
        const item = stoneDetails[k];
        const theta = item.u + ballAngle;
        const cosTheta = Math.cos(theta);

        // Render only if on visible forward hemisphere
        if (cosTheta > -0.2) {
          const depthScale = Math.max(0, cosTheta);
          const px = ballX + cosTheta * (ballRadius * 0.78);
          const py = ballCenterY + item.v * (ballRadius * 0.78);

          ctx.beginPath();
          ctx.ellipse(
            px,
            py,
            item.r * depthScale,
            item.r * 0.75,
            0,
            0,
            Math.PI * 2
          );
          // Indented shadow
          ctx.fillStyle = `rgba(35, 18, 8, ${(item.depth * depthScale).toFixed(2)})`;
          ctx.fill();

          // Subtle sunlit rim around crater edge
          ctx.strokeStyle = `rgba(255, 235, 195, ${(0.35 * depthScale).toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.restore();

      // Wrap ball when rolls past right edge of screen
      if (ballX > width + ballRadius * 3) {
        ballX = -ballRadius * 2;
        tracks.length = 0;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isMounted]);

  return (
    <>
      {/* ========================================================
          1. 21:9 ULTRA-WIDE CINEMATIC SALOON BACKGROUND CONTAINER
          Fixed, full-viewport background with smooth camera movement
          ======================================================== */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none no-print"
        aria-hidden="true"
      >
        {/* Continuous cinematic camera glide & pan */}
        <div
          className={`absolute inset-[-6%] w-[112%] h-[112%] transition-transform duration-1000 ease-out ${
            isCameraPaused ? "" : "animate-cinematic-desert-camera"
          }`}
          style={{ willChange: "transform" }}
        >
          <Image
            src="/assets/desert-saloon-cinematic.jpg"
            alt="Weathered western saloon in red-rock mesa desert"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter saturate-[1.08] contrast-[1.04]"
          />
        </div>

        {/* Dynamic Canvas Simulation (Particles, Rolling Stone Ball, Tumbleweed) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Low Sun Flare Bloom Flaring Through Saloon & Trees */}
        <div
          className="absolute top-0 right-0 w-[60vw] h-[55vh] pointer-events-none opacity-45 mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle at 75% 25%, rgba(255, 225, 160, 0.75) 0%, rgba(240, 160, 80, 0.35) 45%, transparent 75%)",
          }}
        />

        {/* ========================================================
            2. INITIAL BRIGHT WHITE DUST HAZE OVERLAY
            Opens on bright white haze that slowly clears over 4s
            ======================================================== */}
        <div
          className={`fixed inset-0 z-10 pointer-events-none transition-opacity duration-[3500ms] ease-out ${
            hazeActive ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(255, 252, 242, 0.98) 0%, rgba(248, 235, 205, 0.92) 55%, rgba(220, 185, 140, 0.85) 100%)",
            backdropFilter: hazeActive ? "blur(14px)" : "blur(0px)",
          }}
        />

        {/* ========================================================
            3. CINEMATIC 21:9 LETTERBOX & CONTRAST PROTECTION VIGNETTE
            Ensures all cards, dossier, and buttons stay 100% readable
            ======================================================== */}
        {/* Top bar vignette */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-ink/80 via-ink/35 to-transparent pointer-events-none" />

        {/* Bottom deep gradient ensuring paper cards pop */}
        <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent pointer-events-none" />

        {/* Subtle radial film vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(12, 10, 9, 0.1) 0%, rgba(12, 10, 9, 0.55) 100%)",
          }}
        />
      </div>

      {/* ========================================================
          4. INTERACTIVE AMBIENT CONTROLS (Corner Control Deck)
          Allows user to toggle procedural desert audio & camera glide
          ======================================================== */}
      <aside
        aria-label="Cinematic background and ambience controls"
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 select-none no-print"
      >
        {/* Procedural Desert Ambience Sound Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          title={isAudioMuted ? "Turn on procedural desert audio" : "Mute procedural desert audio"}
          aria-label={
            isAudioMuted
              ? "Turn on procedural desert audio ambience"
              : "Mute procedural desert audio ambience"
          }
          className="flex items-center gap-2 px-3 py-1.5 bg-paper/95 hover:bg-cream border-2 border-ink rounded font-mono text-xs font-black text-ink shadow-hard transition-all active:translate-y-0.5 active:shadow-none pointer-events-auto"
        >
          {isAudioMuted ? (
            <>
              <span className="text-crimson">🔇</span>
              <span className="hidden sm:inline">DESERT SOUND:</span>
              <span className="text-muted">MUTED</span>
            </>
          ) : (
            <>
              <span className="text-crimson">🏜️</span>
              <span className="hidden sm:inline">DESERT AMBIENCE:</span>
              <span className="text-emerald-700">ACTIVE</span>
              {/* Mini animated audio visualizer bars */}
              <span className="flex items-end gap-0.5 h-3 ml-0.5" aria-hidden="true">
                <span className="w-1 bg-crimson rounded-full animate-bounce h-2" />
                <span className="w-1 bg-crimson rounded-full animate-bounce [animation-delay:0.15s] h-3" />
                <span className="w-1 bg-crimson rounded-full animate-bounce [animation-delay:0.3s] h-2.5" />
              </span>
            </>
          )}
        </button>

        {/* Camera glide status chip */}
        <button
          type="button"
          onClick={() => setIsCameraPaused((prev) => !prev)}
          title={isCameraPaused ? "Resume camera glide" : "Pause camera glide"}
          aria-label={isCameraPaused ? "Resume camera glide" : "Pause camera glide"}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-ink/85 hover:bg-ink text-paper border-2 border-ink rounded font-mono text-[11px] font-bold shadow-hard transition-all pointer-events-auto"
        >
          <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
          <span>21:9 CINEMATIC 4K</span>
        </button>
      </aside>

      {/* Embedded CSS Keyframes for Cinematic Camera Sweeps */}
      <style jsx global>{`
        @keyframes cinematicDesertGlide {
          0% {
            transform: scale(1.04) translate(0%, 0%);
          }
          25% {
            transform: scale(1.12) translate(-2.2%, -1.2%);
          }
          50% {
            transform: scale(1.17) translate(-3.8%, -2.2%);
          }
          75% {
            transform: scale(1.11) translate(-1.4%, -3.2%);
          }
          100% {
            transform: scale(1.04) translate(0%, 0%);
          }
        }

        .animate-cinematic-desert-camera {
          animation: cinematicDesertGlide 42s ease-in-out infinite alternate;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-cinematic-desert-camera {
            animation: none !important;
            transform: scale(1.05) !important;
          }
        }
      `}</style>
    </>
  );
};
