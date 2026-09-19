"use client";

import React, { useEffect, useRef } from "react";

interface ConfettiProps {
  durationMs?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  alpha: number;
}

export const Confetti: React.FC<ConfettiProps> = ({ durationMs = 4000 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const brandColors = ["#B30033", "#1EB0D8", "#E0A526", "#FFF4E0", "#FBFAF7"];
    const particles: Particle[] = [];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 120,
        y: height * 0.45,
        size: Math.random() * 8 + 6,
        color: brandColors[Math.floor(Math.random() * brandColors.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: -Math.random() * 14 - 6,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1,
      });
    }

    let animId: number;
    const startTime = performance.now();

    const loop = (time: number) => {
      const elapsed = time - startTime;
      if (elapsed > durationMs) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vy += 0.38; // gravity
        p.vx *= 0.985; // drag
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (elapsed > durationMs - 1000) {
          p.alpha = Math.max(0, 1 - (elapsed - (durationMs - 1000)) / 1000);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = "#0B0B0B";
        ctx.lineWidth = 1;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [durationMs]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 no-print"
      aria-hidden="true"
    />
  );
};
