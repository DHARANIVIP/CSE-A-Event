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
          <span className="font-display text-2xl tracking-tighter text-crimson font-black drop-shadow-[2px_2px_0px_#1EB0D8]">
            MYSTERY BOX
          </span>
          <div className="absolute -top-3.5 -right-3 rotate-[-12deg] pointer-events-none group-hover:rotate-[-6deg] transition-transform">
            <DetectiveHat size={26} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className={`relative flex flex-col items-center select-none text-center ${className}`}>
      {/* Title Lockup with Tilted Fedora on top of the last letter */}
      <div className="relative inline-block">
        <h1
          className="font-display font-black uppercase text-crimson tracking-tight leading-none"
          style={{
            fontSize: "clamp(3.2rem, 11vw, 7.5rem)",
            textShadow:
              "3px 3px 0 #0B0B0B, -2px -2px 0 #0B0B0B, 2px -2px 0 #0B0B0B, -2px 2px 0 #0B0B0B, 6px 6px 0px var(--cyan-shadow)",
            WebkitTextStroke: "2px #0B0B0B",
          }}
        >
          <span className="hidden sm:inline">MYSTERY BOX</span>
          <span className="sm:hidden block">MYSTERY</span>
          <span className="sm:hidden block">BOX</span>
        </h1>

        {/* Tilted Fedora (-12deg) placed on top-right corner of final letter */}
        <div
          className="absolute -top-7 -right-5 sm:-top-11 sm:-right-8 rotate-[-12deg] pointer-events-none animate-bounce"
          style={{ animationDuration: "3s" }}
        >
          <DetectiveHat size={72} className="w-14 sm:w-20 md:w-24" />
        </div>
      </div>

      {/* Pacifico Subtitle Signature */}
      <div className="mt-3 sm:mt-4 font-script text-xl sm:text-2xl md:text-3xl text-ink">
        <span>The Digital Case · by </span>
        <span className="underline decoration-2 decoration-crimson underline-offset-4 font-semibold text-ink">
          {eventConfig.organizerTeam}
        </span>
      </div>
    </div>
  );
};
