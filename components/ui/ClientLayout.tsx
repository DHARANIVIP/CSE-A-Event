"use client";

import React from "react";
import { Header } from "./Header";
import { OfflineBanner } from "./OfflineBanner";
import { BrickBackground } from "../background/BrickBackground";
import { RainBackground } from "../background/RainBackground";
import { DustMotes } from "../background/DustMotes";
import { useBackgroundPrefs } from "../background/useBackgroundPrefs";
import { SkipLink } from "./SkipLink";
import { eventConfig } from "@/config/event.config";

import { usePathname } from "next/navigation";

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bgPrefs = useBackgroundPrefs();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      <SkipLink />
      <OfflineBanner />

      {/* Procedural Canvas & CSS Brick Wall Background with Noir Atmosphere */}
      <BrickBackground
        brightnessLevel={bgPrefs.brickBrightness}
        overlayOpacity={bgPrefs.overlayOpacity}
      />
      <DustMotes enabled={true} />
      <RainBackground enabled={bgPrefs.rainEnabled} />

      {/* Sticky Paper Header */}
      <Header bgPrefs={bgPrefs} />

      {/* Main Dynamic Viewport */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 z-10 flex flex-col">
        {children}
      </main>

      {/* Global Retro Monospace Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center select-none z-10 no-print">
        <div className="bg-paper/90 border-2 border-ink rounded px-4 py-3 shadow-hard-sm">
          <p className="font-mono text-xs sm:text-sm text-ink leading-relaxed">
            Built for{" "}
            <span className="font-bold text-crimson underline decoration-1">
              {eventConfig.collegeName}
            </span>{" "}
            · {eventConfig.year}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] text-muted">
            <a href="/rules" className="hover:text-crimson underline">
              EVENT RULES
            </a>
            <span>·</span>
            <a href="/about" className="hover:text-crimson underline">
              ABOUT
            </a>
            <span>·</span>
            <a href="/admin/login" className="hover:text-crimson underline">
              ORGANIZER ACCESS
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
