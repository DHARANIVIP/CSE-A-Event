"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../brand/Logo";
import { TeamBadge } from "../brand/TeamBadge";
import { BackgroundToggle } from "../background/BackgroundToggle";
import { SoundToggle } from "../sound/SoundToggle";
import { BackgroundPreferences } from "../background/useBackgroundPrefs";

interface HeaderProps {
  bgPrefs: BackgroundPreferences;
}

export const Header: React.FC<HeaderProps> = ({ bgPrefs }) => {
  const pathname = usePathname();
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if team is logged in via /api/me
    const checkMe = async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.team) {
            setTeam(data.team);
          }
        }
      } catch {
        // ignore
      }
    };
    checkMe();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setTeam(null);
      window.location.href = "/";
    } catch {
      // ignore
    }
  };

  const navLinks = [
    { href: "/case", label: "CASE FILES" },
    { href: "/rules", label: "RULES" },
    { href: "/box", label: "MYSTERY BOX" },
    { href: "/about", label: "ABOUT" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full px-3 py-2.5 sm:px-6 no-print">
      <div className="w-full max-w-7xl mx-auto bg-paper border-3 border-ink rounded-md shadow-hard-sm px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Compact Logo */}
        <div className="flex items-center gap-3">
          <Logo isCompact />
        </div>

        {/* Center: Desktop Nav Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-6 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-ink"
        >
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-crimson ${
                  isActive ? "text-crimson underline decoration-2 underline-offset-4" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Controls & Team Badge */}
        <div className="flex items-center gap-2">
          <SoundToggle />
          <BackgroundToggle prefs={bgPrefs} />

          <div className="hidden sm:block">
            <TeamBadge
              teamId={team?.id}
              teamName={team?.name}
              onLogout={team ? handleLogout : undefined}
            />
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 bg-cream border-2 border-ink rounded text-ink shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full max-w-7xl mx-auto mt-2 bg-paper border-3 border-ink rounded-md shadow-hard p-4 space-y-3 font-mono text-sm font-bold uppercase">
          <div className="flex sm:hidden pb-2 border-b border-ink/20">
            <TeamBadge
              teamId={team?.id}
              teamName={team?.name}
              onLogout={team ? handleLogout : undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2 rounded bg-cream/60 border border-ink/40 text-center hover:bg-cream hover:text-crimson ${
                  pathname === item.href ? "border-crimson text-crimson" : "text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
