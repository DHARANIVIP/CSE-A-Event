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
      {/* Light Rays Fanning From Inside when open/opening */}
      {isOpen && (
        <div className="absolute inset-0 -top-16 flex items-center justify-center pointer-events-none z-0 animate-pulse">
          <svg width="340" height="240" viewBox="0 0 340 240" fill="none">
            <g opacity="0.6">
              <polygon points="170,140 70,0 100,0" fill="#E0A526" fillOpacity="0.4" />
              <polygon points="170,140 130,0 160,0" fill="#FFF4E0" fillOpacity="0.5" />
              <polygon points="170,140 180,0 210,0" fill="#E0A526" fillOpacity="0.4" />
              <polygon points="170,140 240,0 270,0" fill="#FFF4E0" fillOpacity="0.5" />
              <polygon points="170,140 20,40 40,20" fill="#E0A526" fillOpacity="0.3" />
              <polygon points="170,140 300,20 320,40" fill="#E0A526" fillOpacity="0.3" />
            </g>
          </svg>
        </div>
      )}

      {/* Main Vector SVG Chest */}
      <svg
        width="280"
        height="220"
        viewBox="0 0 280 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 filter drop-shadow-[0_8px_0_rgba(11,11,11,0.9)]"
        aria-hidden="true"
      >
        {/* Layer 1: Chest Base Body */}
        <g id="chest-body">
          {/* Main wooden body */}
          <rect
            x="30"
            y="95"
            width="220"
            height="110"
            rx="8"
            fill="#8A0027"
            stroke="#0B0B0B"
            strokeWidth="4"
          />

          {/* Wooden grain panels */}
          <rect x="42" y="105" width="46" height="90" rx="3" fill="#6B001E" />
          <rect x="94" y="105" width="92" height="90" rx="3" fill="#6B001E" />
          <rect x="192" y="105" width="46" height="90" rx="3" fill="#6B001E" />

          {/* Brass vertical straps */}
          <rect
            x="76"
            y="95"
            width="18"
            height="110"
            fill="#E0A526"
            stroke="#0B0B0B"
            strokeWidth="3"
          />
          <rect
            x="186"
            y="95"
            width="18"
            height="110"
            fill="#E0A526"
            stroke="#0B0B0B"
            strokeWidth="3"
          />

          {/* Brass rivets on straps */}
          <circle cx="85" cy="115" r="3" fill="#0B0B0B" />
          <circle cx="85" cy="150" r="3" fill="#0B0B0B" />
          <circle cx="85" cy="185" r="3" fill="#0B0B0B" />
          <circle cx="195" cy="115" r="3" fill="#0B0B0B" />
          <circle cx="195" cy="150" r="3" fill="#0B0B0B" />
          <circle cx="195" cy="185" r="3" fill="#0B0B0B" />

          {/* Corner reinforced brackets */}
          <path d="M30 180 V205 H55" stroke="#E0A526" strokeWidth="6" fill="none" />
          <path d="M250 180 V205 H225" stroke="#E0A526" strokeWidth="6" fill="none" />
        </g>

        {/* Layer 2: Animated Chest Lid */}
        <g
          id="chest-lid"
          className="transition-transform duration-900 ease-out origin-[140px_95px]"
          style={{
            transform: isOpen ? "rotateX(65deg) translateY(-25px)" : "rotateX(0deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Lid curved arch */}
          <path
            d="M26 95 C26 50, 70 30, 140 30 C210 30, 254 50, 254 95 Z"
            fill="#B30033"
            stroke="#0B0B0B"
            strokeWidth="4"
          />

          {/* Lid brass straps */}
          <path
            d="M76 95 C76 60, 80 40, 85 34 H95 C90 40, 86 60, 86 95 Z"
            fill="#E0A526"
            stroke="#0B0B0B"
            strokeWidth="3"
          />
          <path
            d="M186 95 C186 60, 190 40, 195 34 H205 C200 40, 196 60, 196 95 Z"
            fill="#E0A526"
            stroke="#0B0B0B"
            strokeWidth="3"
          />

          {/* Lid brass rivets */}
          <circle cx="85" cy="65" r="3" fill="#0B0B0B" />
          <circle cx="195" cy="65" r="3" fill="#0B0B0B" />
        </g>

        {/* Layer 3: Central Brass Lock Plate & Keyhole */}
        <g id="chest-lock">
          <rect
            x="122"
            y="82"
            width="36"
            height="44"
            rx="5"
            fill="#E0A526"
            stroke="#0B0B0B"
            strokeWidth="3.5"
          />
          {/* Keyhole with breathing glow in idle state */}
          <path
            d="M140 94 C137 94, 135 96, 135 99 C135 101, 136.5 102.5, 137.5 103.5 L136 114 H144 L142.5 103.5 C143.5 102.5, 145 101, 145 99 C145 96, 143 94, 140 94 Z"
            fill={isOpen ? "#FFF4E0" : "#0B0B0B"}
            className={state === "idle" ? "animate-pulse" : ""}
          />
          <circle cx="127" cy="88" r="2" fill="#0B0B0B" />
          <circle cx="153" cy="88" r="2" fill="#0B0B0B" />
          <circle cx="127" cy="120" r="2" fill="#0B0B0B" />
          <circle cx="153" cy="120" r="2" fill="#0B0B0B" />
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
