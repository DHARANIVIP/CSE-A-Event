"use client";

import React, { useEffect, useRef } from "react";
import {
  RAIN_DESKTOP_CONFIG,
  RAIN_MOBILE_CONFIG,
  RAIN_LOW_POWER_CONFIG,
  RainConfig,
  RainPreset,
} from "@/lib/rain-config";
import {
  Droplet,
  checkAndMergeDrops,
  evaluateAdaptiveQuality,
  calculateDropWobble,
} from "@/lib/rain-math";

interface Streak {
  x: number;
  y: number;
  speed: number;
  length: number;
  width: number;
  alpha: number;
  layer: "far" | "mid" | "near";
}

interface Splash {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  lifeMs: number;
  ageMs: number;
}

interface RainBackgroundProps {
  enabled?: boolean;
}

export const RainBackground: React.FC<RainBackgroundProps> = ({ enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const activePresetRef = useRef<RainPreset>("desktop");

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { desynchronized: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const isMobile = width < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    let config: RainConfig = isMobile ? RAIN_MOBILE_CONFIG : RAIN_DESKTOP_CONFIG;
    activePresetRef.current = isMobile ? "mobile" : "desktop";

    // 1. Pre-allocate streaks
    const streaks: Streak[] = [];
    const initStreak = (layer: "far" | "mid" | "near"): Streak => {
      const spRange = config.speed[layer];
      const lenRange = config.length[layer];
      return {
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        speed: spRange[0] + Math.random() * (spRange[1] - spRange[0]),
        length: lenRange[0] + Math.random() * (lenRange[1] - lenRange[0]),
        width: config.width[layer],
        alpha: config.alpha[layer],
        layer,
      };
    };

    for (let i = 0; i < config.streaks.far; i++) streaks.push(initStreak("far"));
    for (let i = 0; i < config.streaks.mid; i++) streaks.push(initStreak("mid"));
    for (let i = 0; i < config.streaks.near; i++) streaks.push(initStreak("near"));

    // 2. Pre-allocate surface droplets
    const droplets: Droplet[] = [];
    const spawnDroplet = (initY?: number): Droplet => {
      const rMin = config.drops.radius[0];
      const rMax = config.drops.radius[1];
      return {
        x: Math.random() * width,
        y: initY !== undefined ? initY : Math.random() * height,
        r: rMin + Math.random() * (rMax - rMin),
        vy: 0,
        wobblePhase: Math.random() * Math.PI * 2,
        isSliding: false,
        trail: [],
      };
    };

    for (let i = 0; i < config.drops.max * 0.4; i++) {
      droplets.push(spawnDroplet());
    }

    // 3. Splash ripples
    const splashes: Splash[] = [];

    // Lightning state
    let lightningTimer = config.lightning.minGapSec * 1000 + Math.random() * 15000;
    let isFlashing = false;
    let flashRemainingMs = 0;

    // Adaptive performance tracking
    let frameTimes: number[] = [];
    let lastTime = performance.now();
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // If reduced motion is requested, render one static frame and stop
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      for (const d of droplets) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220, 235, 255, 0.4)";
        ctx.fill();
      }
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    // Animation Loop
    const loop = (currentTime: number) => {
      if (!isTabVisible) {
        animFrameIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const rawDt = (currentTime - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to <= 50ms
      const dtNorm = dt * 60; // normalized to 60fps
      lastTime = currentTime;

      // Adaptive performance monitoring (over 90 frames)
      const frameDuration = currentTime - (lastTime - dt * 1000);
      frameTimes.push(frameDuration);
      if (frameTimes.length >= 90) {
        const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        frameTimes = [];
        const nextPreset = evaluateAdaptiveQuality(activePresetRef.current, avg, 22);
        if (nextPreset !== activePresetRef.current) {
          activePresetRef.current = nextPreset;
          config = nextPreset === "lowPower" ? RAIN_LOW_POWER_CONFIG : RAIN_MOBILE_CONFIG;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // --- LAYER 1: RAIN STREAKS ---
      ctx.lineCap = "round";
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        s.y += s.speed * dtNorm;
        s.x += config.wind * s.speed * dtNorm;

        // Wrap around
        if (s.y > height + s.length) {
          s.y = -s.length;
          s.x = Math.random() * (width + 200) - 100;
        }

        ctx.strokeStyle = `rgba(220, 235, 255, ${s.alpha})`;
        ctx.lineWidth = s.width;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + config.wind * s.length, s.y + s.length);
        ctx.stroke();
      }

      // --- LAYER 2: SURFACE DROPLETS & TRAILS ---
      // Spawn new drops gradually up to config.drops.max
      if (droplets.length < config.drops.max && Math.random() < config.drops.spawnPerSec * dt) {
        droplets.push(spawnDroplet(0));
      }

      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];
        d.r += config.drops.growthPerSec * dt;

        // Check sliding trigger
        if (!d.isSliding && (d.r >= config.drops.slideThresholdRadius || Math.random() < config.trail.chance)) {
          d.isSliding = true;
          d.vy = config.trail.slideSpeed[0] + Math.random() * (config.trail.slideSpeed[1] - config.trail.slideSpeed[0]);
        }

        if (d.isSliding) {
          d.wobblePhase += 0.12 * dtNorm;
          const wobble = calculateDropWobble(d.wobblePhase, d.vy);
          d.x += wobble;
          d.y += d.vy * dtNorm;
          d.r = Math.max(1.8, d.r - 0.003 * dtNorm); // drops shrink slightly as trail leaves mass

          // Record trail point
          if (Math.random() < 0.4) {
            d.trail.push({ x: d.x, y: d.y, r: d.r * 0.45, alpha: 0.35 });
          }
        }

        // Draw trail
        for (let t = d.trail.length - 1; t >= 0; t--) {
          const pt = d.trail[t];
          pt.alpha *= config.trail.fade;
          if (pt.alpha < 0.03) {
            d.trail.splice(t, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 225, 255, ${pt.alpha})`;
          ctx.fill();
        }

        // Draw main droplet with caustics and specular glint
        ctx.save();
        ctx.translate(d.x, d.y);

        // Dark rim outline
        ctx.beginPath();
        ctx.arc(0, 0, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(20, 10, 10, 0.22)";
        ctx.fill();

        // Inner caustic crescent (lower half)
        ctx.beginPath();
        ctx.arc(0, d.r * 0.25, d.r * 0.65, 0, Math.PI);
        ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
        ctx.fill();

        // Crisp white specular glint (upper-left)
        ctx.beginPath();
        ctx.arc(-d.r * 0.32, -d.r * 0.32, d.r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.fill();

        ctx.restore();

        // Drop merge check against nearby droplets
        for (let j = i - 1; j >= 0; j--) {
          const other = droplets[j];
          const merge = checkAndMergeDrops(d, other);
          if (merge.merged && merge.result) {
            droplets[j] = merge.result;
            droplets.splice(i, 1);
            break;
          }
        }

        // Remove drop once off screen
        if (d.y > height + 20) {
          droplets.splice(i, 1);
        }
      }

      // --- LAYER 3: SPLASH RIPPLES ---
      if (Math.random() < config.splash.chancePerSec * dt) {
        splashes.push({
          x: Math.random() * width,
          y: height - Math.random() * (height * 0.12),
          r: 2,
          maxR: config.splash.maxRadius,
          alpha: 0.35,
          lifeMs: config.splash.lifeMs,
          ageMs: 0,
        });
      }

      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.ageMs += dt * 1000;
        const progress = sp.ageMs / sp.lifeMs;
        if (progress >= 1) {
          splashes.splice(i, 1);
          continue;
        }

        sp.r = 2 + (sp.maxR - 2) * progress;
        const currentAlpha = sp.alpha * (1 - progress);

        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, sp.r, sp.r * 0.35, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220, 235, 255, ${currentAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // --- LAYER 4: LIGHTNING FLASH ---
      if (config.lightning.enabled) {
        lightningTimer -= dt * 1000;
        if (lightningTimer <= 0) {
          isFlashing = true;
          flashRemainingMs = config.lightning.flashMs;
          lightningTimer =
            (config.lightning.minGapSec +
              Math.random() * (config.lightning.maxGapSec - config.lightning.minGapSec)) *
            1000;
        }

        if (isFlashing) {
          flashRemainingMs -= dt * 1000;
          if (flashRemainingMs <= 0) {
            isFlashing = false;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${config.lightning.alpha})`;
            ctx.fillRect(0, 0, width, height);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 no-print"
      aria-hidden="true"
    />
  );
};
