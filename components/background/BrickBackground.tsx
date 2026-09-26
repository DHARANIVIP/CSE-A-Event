"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  BRICK_PALETTE,
  BRICK_GEOMETRY,
  BrickBrightnessLevel,
} from "@/lib/theme-bricks";
import { createMulberry32, DEFAULT_BRICK_SEED } from "@/lib/prng";

interface BrickBackgroundProps {
  brightnessLevel?: BrickBrightnessLevel;
  overlayOpacity?: number;
}

export const BrickBackground: React.FC<BrickBackgroundProps> = ({
  overlayOpacity = 0.18,
}) => {
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const lastRenderedWidthRef = useRef<number>(0);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateBrickWall = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, BRICK_GEOMETRY.maxDevicePixelRatio);

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      const prng = createMulberry32(DEFAULT_BRICK_SEED);

      // 1. Fill entire canvas with base mortar color
      ctx.fillStyle = BRICK_PALETTE.mortar;
      ctx.fillRect(0, 0, width, height);

      // Responsive brick scaling
      const scale = Math.min(Math.max(0.75, width / 1440), 1.15);
      const brickW = BRICK_GEOMETRY.nominalWidth * scale;
      const brickH = BRICK_GEOMETRY.nominalHeight * scale;
      const mortar = BRICK_GEOMETRY.mortarThickness;

      const numRows = Math.ceil(height / (brickH + mortar)) + 1;
      const numCols = Math.ceil(width / (brickW + mortar)) + 2;

      // 2. Draw each brick in running bond layout
      for (let row = -1; row < numRows; row++) {
        const isOffset = Math.abs(row) % 2 === 1;
        const rowOffsetY = row * (brickH + mortar);

        for (let col = -1; col < numCols; col++) {
          const offsetX = col * (brickW + mortar) + (isOffset ? (brickW + mortar) / 2 : 0);

          // Subtle position jitter (±1.5px)
          const jitterX = (prng() - 0.5) * 2 * BRICK_GEOMETRY.jitterPosMax;
          const jitterY = (prng() - 0.5) * 2 * BRICK_GEOMETRY.jitterPosMax;
          const x = offsetX + jitterX;
          const y = rowOffsetY + jitterY;

          // Subtle size variation (±3%)
          const w = brickW * (1 + (prng() - 0.5) * 2 * BRICK_GEOMETRY.jitterSizeRatio);
          const h = brickH * (1 + (prng() - 0.5) * 2 * BRICK_GEOMETRY.jitterSizeRatio);

          // Random base brick color from ramp
          const colorIdx = Math.floor(prng() * BRICK_PALETTE.baseColors.length);
          const baseColor = BRICK_PALETTE.baseColors[colorIdx];

          // Linear gradient top to bottom (6-8% lighter top, darker bottom)
          const grad = ctx.createLinearGradient(x, y, x, y + h);
          grad.addColorStop(0, baseColor);
          grad.addColorStop(1, BRICK_PALETTE.mortarShadow);

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, w, h);

          // Highlight bevel (top & left)
          ctx.strokeStyle = BRICK_PALETTE.highlightEdge;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y + h);
          ctx.lineTo(x, y);
          ctx.lineTo(x + w, y);
          ctx.stroke();

          // Shadow bevel (bottom & right)
          ctx.strokeStyle = BRICK_PALETTE.shadowEdge;
          ctx.beginPath();
          ctx.moveTo(x + w, y);
          ctx.lineTo(x + w, y + h);
          ctx.lineTo(x, y + h);
          ctx.stroke();

          // Tiny darker pits and chips (2 to 4 pits)
          const pitsCount = Math.floor(prng() * 3) + 2;
          ctx.fillStyle = BRICK_PALETTE.pitColor;
          for (let p = 0; p < pitsCount; p++) {
            const pitX = x + prng() * (w - 4) + 2;
            const pitY = y + prng() * (h - 4) + 2;
            const pitR = prng() > 0.7 ? 1.5 : 1;
            ctx.fillRect(pitX, pitY, pitR, pitR);
          }
        }
      }

      // 3. Fast Grain noise pass
      const noiseCount = Math.floor((width * height) / 12);
      ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
      for (let n = 0; n < noiseCount; n++) {
        const nx = prng() * width;
        const ny = prng() * height;
        ctx.fillRect(nx, ny, 1, 1);
      }

      // 4. Subtle Vignette & Top-to-Bottom Shadow
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      vignette.addColorStop(0, BRICK_PALETTE.vignetteInner);
      vignette.addColorStop(1, BRICK_PALETTE.vignetteOuter);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Top to bottom darkening
      const topGrad = ctx.createLinearGradient(0, 0, 0, height);
      topGrad.addColorStop(0, BRICK_PALETTE.gradientOverlayTop);
      topGrad.addColorStop(1, BRICK_PALETTE.gradientOverlayBottom);
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/png");
      setBgDataUrl(dataUrl);
      lastRenderedWidthRef.current = width;
    } catch {
      // If canvas generation fails, CSS fallback remains active
    }
  }, []);

  useEffect(() => {
    // Execute inside requestIdleCallback for fast, non-blocking initial paint
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as unknown as { requestIdleCallback: (fn: () => void) => void }).requestIdleCallback(
          generateBrickWall
        );
      } else {
        setTimeout(generateBrickWall, 50);
      }
    }

    const handleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const delta = Math.abs(window.innerWidth - lastRenderedWidthRef.current);
        if (delta > BRICK_GEOMETRY.resizeThresholdPx) {
          generateBrickWall();
        }
      }, BRICK_GEOMETRY.resizeDebounceMs);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [generateBrickWall]);

  return (
    <>
      {/* 1. Base Layer: Instant Pure-CSS Brick Fallback (SSR & Before JS) */}
      <div
        className="fixed inset-0 -z-30 css-brick-fallback pointer-events-none no-print"
        aria-hidden="true"
      />

      {/* 2. Procedural Canvas Brick Wall Layer */}
      {bgDataUrl && (
        <div
          className="fixed inset-0 -z-20 pointer-events-none transition-opacity duration-500 no-print"
          style={{
            backgroundImage: `url(${bgDataUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
      )}

      {/* 3. Dark Vignette / Radial Overlay to enhance panel contrast (Section 6.7) */}
      <div
        className="fixed inset-0 -z-15 pointer-events-none transition-opacity duration-300 no-print"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)",
        }}
        aria-hidden="true"
      />

      {/* 4. User-Configured Brightness Overlay (0.05, 0.18, 0.32) */}
      <div
        className="fixed inset-0 -z-12 pointer-events-none bg-ink transition-opacity duration-200 no-print"
        style={{ opacity: overlayOpacity }}
        aria-hidden="true"
      />
    </>
  );
};
