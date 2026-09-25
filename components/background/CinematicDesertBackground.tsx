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

interface SandGrain {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  alpha: number;
  baseAlpha: number;
}

interface SandAirStream {
  baseYPercent: number; // 0 to 1
  amplitude: number;
  wavelength: number;
  speed: number;
  thickness: number;
  phase: number;
  alpha: number;
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
  const [isCameraPaused, setIsCameraPaused] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Play Cowboy Theme soundtrack strictly ONE TIME for 6 SECONDS ONLY when user scrolls the landing page
  useEffect(() => {
    setIsMounted(true);

    const onUserScroll = (e?: Event) => {
      // If triggered by wheel, ensure there is actual delta displacement
      if (e && e.type === "wheel") {
        const wheelEv = e as WheelEvent;
        if (Math.abs(wheelEv.deltaY) < 1 && Math.abs(wheelEv.deltaX) < 1) return;
      }

      desertAudio.playSixSecondsOnScroll();

      // Immediately detach all scroll listeners so it cannot be triggered again
      window.removeEventListener("scroll", onUserScroll);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
    };

    window.addEventListener("scroll", onUserScroll, { passive: true });
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });

    // Dissolve dust haze over 3.2 seconds
    const timer = setTimeout(() => {
      setHazeActive(false);
    }, 3200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onUserScroll);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      desertAudio.stop();
    };
  }, []);

  // Main Canvas animation loop for sand air animation, dust motes, stone ball, and tumbleweed
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

    // 1. Sand Air Streams (Flowing volumetric desert wind haze ribbons)
    const sandStreams: SandAirStream[] = [
      {
        baseYPercent: 0.22,
        amplitude: 18,
        wavelength: 280,
        speed: 0.0016,
        thickness: 48,
        phase: 0,
        alpha: 0.08,
      },
      {
        baseYPercent: 0.42,
        amplitude: 24,
        wavelength: 340,
        speed: 0.0022,
        thickness: 65,
        phase: 1.8,
        alpha: 0.11,
      },
      {
        baseYPercent: 0.62,
        amplitude: 20,
        wavelength: 260,
        speed: 0.0028,
        thickness: 55,
        phase: 3.4,
        alpha: 0.13,
      },
      {
        baseYPercent: 0.82,
        amplitude: 16,
        wavelength: 220,
        speed: 0.0035,
        thickness: 75,
        phase: 4.8,
        alpha: 0.16,
      },
    ];

    // 2. High-speed Wind-blown Sand Air Grains (horizontal streaks)
    const grainCount = width < 768 ? 60 : 130;
    const sandGrains: SandGrain[] = [];
    for (let i = 0; i < grainCount; i++) {
      const vx = 2.8 + Math.random() * 4.6;
      sandGrains.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy: (Math.random() - 0.4) * 0.45,
        length: 6 + Math.random() * 14,
        width: 0.8 + Math.random() * 1.4,
        baseAlpha: 0.2 + Math.random() * 0.45,
        alpha: 0.3,
      });
    }

    // 3. Volumetric Floating Sand Dust Motes
    const dustCount = width < 768 ? 30 : 60;
    const dustParticles: DustParticle[] = [];
    for (let i = 0; i < dustCount; i++) {
      dustParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0.4 + Math.random() * 0.8,
        vy: (Math.random() - 0.45) * 0.3,
        size: 0.8 + Math.random() * 2.0,
        baseAlpha: 0.15 + Math.random() * 0.35,
        alpha: 0.2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.012 + Math.random() * 0.02,
      });
    }

    // 4. Rolling Stone Ball State
    const ballRadius = width < 768 ? 22 : 32;
    let ballX = -ballRadius * 2;
    const groundY = height * 0.9;
    let ballAngle = 0;
    const ballSpeed = 1.05;
    let lastAudioStep = 0;

    const tracks: SandTrackSegment[] = [];
    const sandPuffs: SandPuff[] = [];
    let frameCounter = 0;

    // 5. Tumbleweed State
    let tumbleX = width + 80;
    let tumbleY = height * 0.83;
    let tumbleAngle = 0;
    let tumbleSpeed = 1.7;
    let tumbleBounce = 0;
    const tumbleRadius = width < 768 ? 18 : 26;

    // 6. Stone Ball 3D Cratering
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
      lastTime = now;
      frameCounter++;

      ctx.clearRect(0, 0, width, height);

      // ===============================================================
      // LAYER 1: PROCEDURAL SAND AIR WIND STREAMS (Atmospheric Blowing Sand)
      // Soft, glowing horizontal ribbons of sand-laden desert air
      // ===============================================================
      const gustCycle = Math.sin(now * 0.0008) * 0.25 + 0.75; // subtle breathing wind gust cycle

      for (let s = 0; s < sandStreams.length; s++) {
        const stream = sandStreams[s];
        stream.phase += stream.speed;

        const cy = stream.baseYPercent * height;
        const currentAlpha = stream.alpha * gustCycle;

        // Draw flowing sand air ribbon
        ctx.save();
        ctx.beginPath();

        const step = 40;
        let first = true;

        // Top edge of the sand air ribbon
        for (let x = -40; x <= width + 40; x += step) {
          const wave =
            Math.sin(x / stream.wavelength + stream.phase) * stream.amplitude +
            Math.cos((x * 0.6) / stream.wavelength + stream.phase * 1.3) *
              (stream.amplitude * 0.4);
          const y = cy + wave - stream.thickness * 0.5;

          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Bottom edge of the sand air ribbon (going backward)
        for (let x = width + 40; x >= -40; x -= step) {
          const wave =
            Math.sin(x / stream.wavelength + stream.phase) * stream.amplitude +
            Math.cos((x * 0.6) / stream.wavelength + stream.phase * 1.3) *
              (stream.amplitude * 0.4);
          const y = cy + wave + stream.thickness * 0.5;
          ctx.lineTo(x, y);
        }

        ctx.closePath();

        // Warm desert sand gradient
        const streamGrad = ctx.createLinearGradient(0, cy - stream.thickness, 0, cy + stream.thickness);
        streamGrad.addColorStop(0, "rgba(240, 214, 168, 0)");
        streamGrad.addColorStop(0.5, `rgba(238, 202, 146, ${currentAlpha.toFixed(3)})`);
        streamGrad.addColorStop(1, "rgba(240, 214, 168, 0)");

        ctx.fillStyle = streamGrad;
        ctx.fill();
        ctx.restore();
      }

      // ===============================================================
      // LAYER 2: FAST-MOVING SAND AIR PARTICLES (Wind-Blown Sand Grains)
      // Whisked across the screen by horizontal desert air currents
      // ===============================================================
      ctx.save();
      for (let i = 0; i < sandGrains.length; i++) {
        const g = sandGrains[i];
        g.x += g.vx * gustCycle;
        g.y += g.vy + Math.sin(g.x * 0.015) * 0.35;

        // Reset particle once blown off-screen
        if (g.x > width + 40) {
          g.x = -30 - Math.random() * 40;
          g.y = Math.random() * height;
        }

        const alpha = g.baseAlpha * gustCycle;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x - g.length, g.y - g.vy * 2);
        ctx.strokeStyle = `rgba(245, 218, 165, ${alpha.toFixed(3)})`;
        ctx.lineWidth = g.width;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.restore();

      // ===============================================================
      // LAYER 3: FLOATING VOLUMETRIC SAND DUST MOTES
      // Gentle sunlit desert dust floating lazily in the air
      // ===============================================================
      for (let i = 0; i < dustParticles.length; i++) {
        const p = dustParticles[i];
        p.wobble += p.wobbleSpeed;
        p.x += p.vx * (1 + Math.sin(p.wobble) * 0.35) * gustCycle;
        p.y += p.vy + Math.cos(p.wobble) * 0.25;

        if (p.x > width + 20) p.x = -20;
        if (p.y > height + 20) p.y = -20;
        if (p.y < -20) p.y = height + 20;

        const currentAlpha = p.baseAlpha * (0.7 + Math.sin(p.wobble) * 0.3);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(248, 224, 180, ${currentAlpha.toFixed(3)})`;
        ctx.shadowColor = "rgba(255, 220, 160, 0.3)";
        ctx.shadowBlur = 3;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ===============================================================
      // LAYER 4: TUMBLEWEED
      // ===============================================================
      tumbleX -= tumbleSpeed * gustCycle;
      tumbleAngle -= 0.035;
      tumbleBounce += 0.055;
      const currentTumbleY = tumbleY - Math.abs(Math.sin(tumbleBounce)) * 20;

      // Soft tumbleweed shadow
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(tumbleX, groundY - 10, tumbleRadius * 0.85, tumbleRadius * 0.25, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(45, 25, 14, 0.12)";
      ctx.fill();

      // Tumbleweed branches
      ctx.translate(tumbleX, currentTumbleY);
      ctx.rotate(tumbleAngle);
      ctx.strokeStyle = "rgba(115, 84, 56, 0.6)";
      ctx.lineWidth = 1.3;

      for (let j = 0; j < 6; j++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, tumbleRadius, tumbleRadius * 0.55, (j * Math.PI) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      if (tumbleX < -tumbleRadius * 3) {
        tumbleX = width + 100 + Math.random() * 200;
        tumbleSpeed = 1.3 + Math.random() * 0.7;
      }

      // ===============================================================
      // LAYER 5: ROLLING STONE BALL & TRACKS
      // ===============================================================
      ballX += ballSpeed;
      ballAngle += ballSpeed / ballRadius;

      if (frameCounter % 4 === 0 && ballX > -ballRadius && ballX < width + ballRadius * 2) {
        tracks.push({
          x: ballX - ballRadius * 0.1,
          y: groundY + ballRadius * 0.82,
          width: ballRadius * 0.9,
          alpha: 0.3,
        });
        if (tracks.length > 180) tracks.shift();
      }

      // Soft sand tracks
      for (let i = 0; i < tracks.length; i++) {
        const tr = tracks[i];
        tr.alpha *= 0.9985;
        if (tr.alpha > 0.02) {
          ctx.beginPath();
          ctx.ellipse(tr.x, tr.y, tr.width * 0.5, 3.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(75, 48, 28, ${tr.alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      // Sand dust puffs
      if (frameCounter % 9 === 0 && ballX > 0 && ballX < width) {
        sandPuffs.push({
          x: ballX - ballRadius * 0.6,
          y: groundY + ballRadius * 0.75,
          vx: -(0.3 + Math.random() * 0.4),
          vy: -(0.2 + Math.random() * 0.3),
          size: 2.5 + Math.random() * 4,
          alpha: 0.3,
          maxLife: 40 + Math.random() * 25,
          life: 0,
        });

        if (now - lastAudioStep > 600) {
          desertAudio.playRollingStoneStep();
          lastAudioStep = now;
        }
      }

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
        ctx.fillStyle = `rgba(224, 196, 155, ${currentAlpha.toFixed(3)})`;
        ctx.fill();
      }

      // 3D Stone Sphere
      const ballCenterY = groundY;

      // Contact shadow
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
      ctx.fillStyle = "rgba(30, 18, 10, 0.4)";
      ctx.filter = "blur(3px)";
      ctx.fill();
      ctx.restore();

      // Stone Ball Base
      ctx.save();
      ctx.beginPath();
      ctx.arc(ballX, ballCenterY, ballRadius, 0, Math.PI * 2);
      ctx.clip();

      const grad = ctx.createRadialGradient(
        ballX - ballRadius * 0.38,
        ballCenterY - ballRadius * 0.38,
        ballRadius * 0.08,
        ballX,
        ballCenterY,
        ballRadius
      );
      grad.addColorStop(0.0, "#fff5dd");
      grad.addColorStop(0.2, "#e3bc88");
      grad.addColorStop(0.55, "#ab7b49");
      grad.addColorStop(0.82, "#684523");
      grad.addColorStop(1.0, "#2a180b");
      ctx.fillStyle = grad;
      ctx.fillRect(ballX - ballRadius, ballCenterY - ballRadius, ballRadius * 2, ballRadius * 2);

      // Texture flecks
      ctx.fillStyle = "rgba(45, 25, 12, 0.35)";
      for (let s = 0; s < 14; s++) {
        const sx = ballX + Math.sin(s * 1.7) * (ballRadius * 0.7);
        const sy = ballCenterY + Math.cos(s * 2.3) * (ballRadius * 0.7);
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // Craters
      for (let k = 0; k < stoneDetails.length; k++) {
        const item = stoneDetails[k];
        const theta = item.u + ballAngle;
        const cosTheta = Math.cos(theta);

        if (cosTheta > -0.2) {
          const depthScale = Math.max(0, cosTheta);
          const px = ballX + cosTheta * (ballRadius * 0.78);
          const py = ballCenterY + item.v * (ballRadius * 0.78);

          ctx.beginPath();
          ctx.ellipse(px, py, item.r * depthScale, item.r * 0.75, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(35, 18, 8, ${(item.depth * depthScale).toFixed(2)})`;
          ctx.fill();

          ctx.strokeStyle = `rgba(255, 235, 195, ${(0.35 * depthScale).toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.restore();

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
          1. CINEMATIC DESERT BACKGROUND CONTAINER
          Softened contrast + warm atmospheric sand ambient wash
          ======================================================== */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none no-print"
        aria-hidden="true"
      >
        {/* Soft, continuous cinematic camera glide & pan */}
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
            className="object-cover object-center filter brightness-[0.96] contrast-[0.90] saturate-[0.92]"
          />
        </div>

        {/* Warm desert sand air wash (Harmonizes background, eliminates harsh stark contrast) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(235, 198, 150, 0.16) 0%, rgba(220, 168, 120, 0.12) 40%, rgba(195, 140, 95, 0.18) 100%)",
            mixBlendMode: "color-burn",
          }}
        />

        {/* Ambient warm golden atmospheric glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: "rgba(224, 185, 142, 0.14)",
          }}
        />

        {/* Active Sand Air & Wind Canvas (Procedural blowing sand ribbons & wind streaks) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Soft Sun Flare Bloom Flaring Through Saloon & Mesa */}
        <div
          className="absolute top-0 right-0 w-[55vw] h-[50vh] pointer-events-none opacity-30 mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle at 75% 25%, rgba(255, 230, 175, 0.65) 0%, rgba(240, 175, 105, 0.25) 50%, transparent 75%)",
          }}
        />

        {/* ========================================================
            2. INITIAL DESERT DUST HAZE OVERLAY
            Opens on warm dust haze that smoothly dissolves
            ======================================================== */}
        <div
          className={`fixed inset-0 z-10 pointer-events-none transition-opacity duration-[3000ms] ease-out ${
            hazeActive ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(255, 248, 232, 0.95) 0%, rgba(244, 226, 192, 0.88) 55%, rgba(215, 178, 132, 0.8) 100%)",
            backdropFilter: hazeActive ? "blur(10px)" : "blur(0px)",
          }}
        />

        {/* ========================================================
            3. HARMONIOUS WARM DESERT VIGNETTE (NON-OVER-CONTRAST)
            Replaces pitch-black vignettes with soft warm shadows
            ======================================================== */}
        {/* Soft header ambient gradient */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#1a1410]/35 via-[#1a1410]/10 to-transparent pointer-events-none" />

        {/* Soft warm footer gradient - ensures buttons and cards stand out without harsh black contrast */}
        <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#24170f]/40 via-[#24170f]/15 to-transparent pointer-events-none" />

        {/* Very soft warm perimeter vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(45, 28, 18, 0.22) 100%)",
          }}
        />
      </div>

      {/* ========================================================
          4. CINEMATIC CAMERA CONTROLS (Corner Control Deck)
          ======================================================== */}
      <aside
        aria-label="Cinematic background controls"
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 select-none no-print"
      >
        {/* Camera glide status chip */}
        <button
          type="button"
          onClick={() => setIsCameraPaused((prev) => !prev)}
          title={isCameraPaused ? "Resume camera glide" : "Pause camera glide"}
          aria-label={isCameraPaused ? "Resume camera glide" : "Pause camera glide"}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1410]/80 hover:bg-[#1a1410] text-[#fbf5e8] border border-[#1a1410] rounded font-mono text-[11px] font-bold shadow-sm transition-all pointer-events-auto"
        >
          <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
          <span>21:9 CINEMATIC</span>
        </button>
      </aside>

      {/* Embedded CSS Keyframes for Cinematic Camera Sweeps */}
      <style jsx global>{`
        @keyframes cinematicDesertGlide {
          0% {
            transform: scale(1.03) translate(0%, 0%);
          }
          25% {
            transform: scale(1.08) translate(-1.8%, -1%);
          }
          50% {
            transform: scale(1.12) translate(-3%, -1.8%);
          }
          75% {
            transform: scale(1.07) translate(-1.2%, -2.4%);
          }
          100% {
            transform: scale(1.03) translate(0%, 0%);
          }
        }

        .animate-cinematic-desert-camera {
          animation: cinematicDesertGlide 44s ease-in-out infinite alternate;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-cinematic-desert-camera {
            animation: none !important;
            transform: scale(1.04) !important;
          }
        }
      `}</style>
    </>
  );
};
