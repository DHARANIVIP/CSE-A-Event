"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../brand/Logo";
import { TeamBadge } from "../brand/TeamBadge";
import { BackgroundPreferences } from "../background/useBackgroundPrefs";
import { LogoutIcon, SoundIcon } from "../icons";
import { LeaderboardModal } from "../case/LeaderboardModal";
import { soundManager } from "../sound/SoundManager";
import { desertAudio } from "../sound/DesertAudioAmbience";

interface HeaderProps {
  bgPrefs: BackgroundPreferences;
}

export const Header: React.FC<HeaderProps> = () => {
  const pathname = usePathname();
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  // Sync mute state on mount and listen to changes
  useEffect(() => {
    setIsAudioMuted(soundManager.getIsMuted());
    const unsubSound = soundManager.subscribe((muted) => setIsAudioMuted(muted));
    const unsubDesert = desertAudio.subscribe((muted) => setIsAudioMuted(muted));

    // Listen for custom trigger to open leaderboard side drawer
    const handleOpenLeaderboard = () => setIsLeaderboardOpen(true);
    window.addEventListener("open-leaderboard", handleOpenLeaderboard);

    // Auto-open if query param ?leaderboard=open is in the URL on /case
    if (typeof window !== "undefined" && pathname === "/case") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("leaderboard") === "open" || params.get("leaderboard") === "true") {
        setIsLeaderboardOpen(true);
      }
    }

    return () => {
      unsubSound();
      unsubDesert();
      window.removeEventListener("open-leaderboard", handleOpenLeaderboard);
    };
  }, [pathname]);

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

  const handleToggleSound = () => {
    const updated = desertAudio.toggleMute();
    setIsAudioMuted(updated);
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

        {/* Center: Desktop Text Nav Links */}
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

        {/* Right: Controls, Leaderboard Button (CASE FILE PAGE ONLY), Audio Toggle, Team Badge & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Universal Sound Audio Toggle */}
          <button
            onClick={handleToggleSound}
            className={`px-2.5 sm:px-3 py-1.5 border-2 border-ink rounded font-mono text-xs font-bold uppercase tracking-wider shadow-hard-sm transition-all flex items-center gap-1.5 select-none active:translate-y-0.5 active:shadow-none ${
              isAudioMuted
                ? "bg-cream text-muted hover:text-ink hover:bg-paper"
                : "bg-paper text-emerald-800 border-ink hover:bg-cream"
            }`}
            title={isAudioMuted ? "Audio Muted: Click to Enable Sound" : "Audio Active: Click to Mute Sound"}
            aria-label={isAudioMuted ? "Unmute site audio" : "Mute site audio"}
          >
            <SoundIcon size={16} muted={isAudioMuted} />
            <span className="hidden sm:inline">
              {isAudioMuted ? "SOUND: OFF" : "SOUND: ON"}
            </span>
          </button>

          {/* LEADERBOARD BUTTON - ONLY SHOWN ON THE CASE FILE PAGE (/case) */}
          {pathname === "/case" && (
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-gold/20 hover:bg-gold/35 border-2 border-ink rounded font-mono text-xs font-bold text-ink uppercase tracking-wider shadow-hard-sm hover:text-crimson hover:-translate-y-0.5 hover:shadow-hard active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 select-none"
              title="View Live Leaderboard (Sidebar)"
            >
              <span className="text-amber-800">🏆</span>
              <span className="hidden sm:inline">LEADERBOARD</span>
            </button>
          )}

          {/* Team Info Panel */}
          <div className="hidden sm:block">
            <TeamBadge teamId={team?.id} teamName={team?.name} />
          </div>

          {/* Separate Logout Button (Immediately beside Team Badge) */}
          {team && (
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 bg-cream border-2 border-ink rounded text-ink shadow-hard-sm hover:text-crimson hover:border-crimson hover:-translate-y-0.5 hover:shadow-hard active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 font-mono text-xs font-bold uppercase select-none"
              title="Log out of session"
              aria-label="Logout"
            >
              <LogoutIcon size={16} />
              <span className="hidden lg:inline">LOGOUT</span>
            </button>
          )}

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
          <div className="flex items-center justify-between pb-2 border-b border-ink/20">
            <TeamBadge teamId={team?.id} teamName={team?.name} />
            {team && (
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 bg-cream border border-ink rounded text-crimson font-mono text-xs font-bold flex items-center gap-1"
              >
                <LogoutIcon size={14} />
                <span>LOGOUT</span>
              </button>
            )}
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

          {/* Mobile Leaderboard Button - CASE FILES PAGE ONLY */}
          {pathname === "/case" && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsLeaderboardOpen(true);
              }}
              className="w-full py-2 bg-gold/25 border-2 border-ink rounded text-ink font-bold flex items-center justify-center gap-2"
            >
              <span>🏆</span>
              <span>VIEW LEADERBOARD SIDEBAR</span>
            </button>
          )}
        </div>
      )}

      {/* Live Leaderboard Side-Drawer Overlay (Displayed exclusively when on /case) */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </header>
  );
};
