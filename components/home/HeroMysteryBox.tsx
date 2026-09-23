"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { MysteryChest } from "../box/MysteryChest";
import { soundManager } from "../sound/SoundManager";

interface HeroMysteryBoxProps {
  isLoggedIn?: boolean;
}

export const HeroMysteryBox: React.FC<HeroMysteryBoxProps> = ({ isLoggedIn = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Dampened 3D tilt angles (max +- 12 degrees)
    const rotateY = (x / (rect.width / 2)) * 12;
    const rotateX = -(y / (rect.height / 2)) * 10;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    soundManager.playLockClick();
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center justify-center py-4 sm:py-6 cursor-pointer group perspective-[900px] select-none"
    >
      <Link
        href={isLoggedIn ? "/box" : "/enter"}
        className="flex flex-col items-center justify-center focus:outline-none"
        aria-label="Access the interactive Mystery Box"
      >
        {/* Soft Warm Kerosene Lantern Radial Glow behind chest */}
        <div
          className={`absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full transition-all duration-700 pointer-events-none -z-10 ${
            isHovered
              ? "bg-amber-400/25 scale-110 blur-2xl"
              : "bg-amber-500/15 scale-95 blur-xl animate-pulse"
          }`}
        />

        {/* 3D Tilting Chest Wrapper */}
        <div
          className="transition-transform duration-200 ease-out will-change-transform"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.04 : 1})`,
            transformStyle: "preserve-3d",
          }}
        >
          <MysteryChest state="idle" />
        </div>

        {/* Tactical Status Pill Badge */}
        <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-cream/90 border-2 border-ink rounded-full font-mono text-[11px] font-black text-ink uppercase tracking-wider shadow-hard-sm group-hover:border-crimson group-hover:text-crimson group-hover:-translate-y-0.5 transition-all">
          <span className="w-2 h-2 rounded-full bg-crimson animate-ping" />
          <span>LOCKED WITH 5-CHARACTER CODE • CLICK TO CRACK</span>
        </div>
      </Link>
    </div>
  );
};
