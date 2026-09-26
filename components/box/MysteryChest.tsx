"use client";

import React from "react";
import { Padlock } from "../icons";

export type ChestState = "idle" | "shake" | "opening" | "open" | "locked-out";

interface MysteryChestProps {
  state: ChestState;
  className?: string;
}

export const MysteryChest: React.FC<MysteryChestProps> = ({ state, className = "" }) => {
  const isShaking = state === "shake";
  const isOpen = state === "open" || state === "opening";
  const isLockedOut = state === "locked-out";

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${
        isShaking ? "animate-[shake_0.4s_ease-in-out]" : ""
      } ${className}`}
    >
      {/* Soft Kerosene Lantern Ambient Warmth from Inside when open */}
      {isOpen && (
        <div className="absolute inset-0 -top-12 flex items-center justify-center pointer-events-none z-0">
          <svg width="320" height="200" viewBox="0 0 320 200" fill="none">
            <defs>
              <radialGradient id="lanternGlow" cx="50%" cy="70%" r="60%">
                <stop offset="0%" stopColor="#F0C268" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#C29038" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#8C6220" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="160" cy="110" rx="140" ry="85" fill="url(#lanternGlow)" />
          </svg>
        </div>
      )}

      {/* Main Vector SVG Wells Fargo Iron-Bound Strongbox */}
      <svg
        width="280"
        height="220"
        viewBox="0 0 280 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 filter drop-shadow-[0_8px_0_rgba(18,13,9,0.9)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="oakWood" x1="140" y1="95" x2="140" y2="205" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#382518" />
            <stop offset="100%" stopColor="#291A10" />
          </linearGradient>
          <linearGradient id="ironBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E2824" />
            <stop offset="100%" stopColor="#1B1714" />
          </linearGradient>
          <linearGradient id="brassLock" x1="122" y1="82" x2="158" y2="126" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C89E46" />
            <stop offset="100%" stopColor="#967026" />
          </linearGradient>
        </defs>

        {/* Layer 1: Strongbox Body */}
        <g id="chest-body">
          {/* Main heavy oak timber body */}
          <rect
            x="30"
            y="95"
            width="220"
            height="110"
            rx="4"
            fill="url(#oakWood)"
            stroke="#150F0A"
            strokeWidth="3.5"
          />

          {/* Vertical oak planks */}
          <rect x="42" y="102" width="46" height="96" rx="2" fill="#2D1D13" stroke="#1F130B" strokeWidth="1" />
          <rect x="94" y="102" width="92" height="96" rx="2" fill="#2E1E14" stroke="#1F130B" strokeWidth="1" />
          <rect x="192" y="102" width="46" height="96" rx="2" fill="#2D1D13" stroke="#1F130B" strokeWidth="1" />

          {/* Forged black iron straps */}
          <rect
            x="76"
            y="95"
            width="18"
            height="110"
            fill="url(#ironBand)"
            stroke="#120E0B"
            strokeWidth="2.5"
          />
          <rect
            x="186"
            y="95"
            width="18"
            height="110"
            fill="url(#ironBand)"
            stroke="#120E0B"
            strokeWidth="2.5"
          />

          {/* Antique brass hammered rivets */}
          <circle cx="85" cy="112" r="2.8" fill="#B88D3D" stroke="#5E4316" strokeWidth="0.8" />
          <circle cx="85" cy="148" r="2.8" fill="#B88D3D" stroke="#5E4316" strokeWidth="0.8" />
          <circle cx="85" cy="184" r="2.8" fill="#B88D3D" stroke="#5E4316" strokeWidth="0.8" />
          <circle cx="195" cy="112" r="2.8" fill="#B88D3D" stroke="#5E4316" strokeWidth="0.8" />
          <circle cx="195" cy="148" r="2.8" fill="#B88D3D" stroke="#5E4316" strokeWidth="0.8" />
          <circle cx="195" cy="184" r="2.8" fill="#B88D3D" stroke="#5E4316" strokeWidth="0.8" />

          {/* Corner iron brackets */}
          <path d="M30 180 V205 H55" stroke="#221C18" strokeWidth="5.5" strokeLinecap="square" fill="none" />
          <path d="M250 180 V205 H225" stroke="#221C18" strokeWidth="5.5" strokeLinecap="square" fill="none" />
          <circle cx="48" cy="198" r="2" fill="#B88D3D" />
          <circle cx="232" cy="198" r="2" fill="#B88D3D" />
        </g>

        {/* Layer 2: Animated Strongbox Lid */}
        <g
          id="chest-lid"
          className="transition-transform duration-900 ease-out origin-[140px_95px]"
          style={{
            transform: isOpen ? "rotateX(62deg) translateY(-22px)" : "rotateX(0deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Arched oak lid */}
          <path
            d="M26 95 C26 52, 70 34, 140 34 C210 34, 254 52, 254 95 Z"
            fill="url(#oakWood)"
            stroke="#150F0A"
            strokeWidth="3.5"
          />

          {/* Lid forged iron curved bands */}
          <path
            d="M76 95 C76 62, 80 43, 85 37 H95 C90 43, 86 62, 86 95 Z"
            fill="url(#ironBand)"
            stroke="#120E0B"
            strokeWidth="2"
          />
          <path
            d="M186 95 C186 62, 190 43, 195 37 H205 C200 43, 196 62, 196 95 Z"
            fill="url(#ironBand)"
            stroke="#120E0B"
            strokeWidth="2"
          />

          {/* Lid brass rivets */}
          <circle cx="85" cy="65" r="2.8" fill="#B88D3D" stroke="#5E4316" strokeWidth="0.8" />
          <circle cx="195" cy="65" r="2.8" fill="#B88D3D" stroke="#5E4316" strokeWidth="0.8" />
        </g>

        {/* Layer 3: Heavy Antique Brass Tumbler Lock Plate */}
        <g id="chest-lock">
          <rect
            x="122"
            y="82"
            width="36"
            height="44"
            rx="3"
            fill="url(#brassLock)"
            stroke="#150F0A"
            strokeWidth="2.5"
          />
          {/* Iron hasp bar */}
          <rect x="134" y="77" width="12" height="14" rx="2" fill="#201B17" stroke="#120E0B" strokeWidth="1" />
          {/* Keyhole */}
          <path
            d="M140 94 C137.5 94, 136 95.8, 136 98.2 C136 100, 137.2 101.4, 138 102.2 L137 112 H143 L142 102.2 C142.8 101.4, 144 100, 144 98.2 C144 95.8, 142.5 94, 140 94 Z"
            fill={isOpen ? "#F2D288" : "#1A1410"}
          />
          {/* Screws on lock plate */}
          <circle cx="127" cy="88" r="1.8" fill="#5E4316" />
          <circle cx="153" cy="88" r="1.8" fill="#5E4316" />
          <circle cx="127" cy="120" r="1.8" fill="#5E4316" />
          <circle cx="153" cy="120" r="1.8" fill="#5E4316" />
        </g>
      </svg>

      {/* Locked-Out Padlock Chain Overlay */}
      {isLockedOut && (
        <div className="absolute inset-0 bg-ink/65 backdrop-blur-xs rounded-lg flex flex-col items-center justify-center p-4 border-3 border-danger shadow-hard z-20 animate-fade-in">
          <div className="p-3 bg-cream rounded-full border-3 border-danger shadow-hard mb-2">
            <Padlock size={36} />
          </div>
          <span className="font-mono text-sm font-black text-paper uppercase tracking-wider">
            SECURITY LOCKOUT
          </span>
          <span className="font-mono text-xs text-paper/80 mt-1 uppercase">
            Cooldown Timer Enforced
          </span>
        </div>
      )}
    </div>
  );
};
