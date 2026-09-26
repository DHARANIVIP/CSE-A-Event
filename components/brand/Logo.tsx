import React from "react";
import Link from "next/link";
import { DetectiveHat } from "./DetectiveHat";
import { eventConfig } from "@/config/event.config";

interface LogoProps {
  className?: string;
  isCompact?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", isCompact = false }) => {
  if (isCompact) {
    return (
      <Link
        href="/"
        className={`group inline-flex items-center gap-2 focus-visible:outline-none ${className}`}
        aria-label="Mystery Box Home"
      >
        <div className="relative">
          <span className="font-display text-2xl tracking-tight text-crimson font-black drop-shadow-[2px_2px_0px_rgba(23,17,12,0.8)]">
            MYSTERY BOX
          </span>
          <div className="absolute -top-3.5 -right-3.5 rotate-[-10deg] pointer-events-none group-hover:rotate-[-5deg] transition-transform">
            <DetectiveHat size={28} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className={`relative flex flex-col items-center select-none text-center ${className}`}>
      {/* Title Lockup with Tilted Western Stetson on top of the last letter */}
      <div className="relative inline-block">
        <h1
          className="font-display font-black uppercase text-crimson tracking-tight leading-none"
          style={{
            fontSize: "clamp(3.2rem, 11vw, 7.2rem)",
            textShadow:
              "2px 2px 0 #2b1810, -1px -1px 0 #2b1810, 1px -1px 0 #2b1810, -1px 1px 0 #2b1810, 4px 4px 0px rgba(35, 20, 12, 0.45)",
            WebkitTextStroke: "1px #2b1810",
          }}
        >
          <span className="hidden sm:inline">MYSTERY BOX</span>
          <span className="sm:hidden block">MYSTERY</span>
          <span className="sm:hidden block">BOX</span>
        </h1>

        {/* Tilted Western Stetson (-10deg) placed on top-right corner of final letter */}
        <div
          className="absolute -top-8 -right-6 sm:-top-12 sm:-right-9 rotate-[-10deg] pointer-events-none transition-transform duration-300 hover:rotate-[-5deg]"
        >
          <DetectiveHat size={78} className="w-16 sm:w-22 md:w-26" />
        </div>
      </div>

      {/* Western Bureau Subtitle Ribbon */}
      <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 font-mono text-xs sm:text-sm md:text-base text-ink font-bold tracking-wider uppercase">
        <span className="text-brass">★</span>
        <span className="text-ink">The Digital Case</span>
        <span className="text-brass">·</span>
        <span className="text-muted">By</span>
        <span className="text-crimson underline decoration-2 decoration-brass underline-offset-4 font-black">
          {eventConfig.organizerTeam}
        </span>
        <span className="text-brass">★</span>
      </div>
    </div>
  );
};
