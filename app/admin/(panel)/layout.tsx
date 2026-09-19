"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [serverTime, setServerTime] = useState<string>("");
  const [clockDriftMs, setClockDriftMs] = useState<number | null>(null);

  useEffect(() => {
    const syncTime = async () => {
      const clientStart = Date.now();
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const clientEnd = Date.now();
          const rtt = clientEnd - clientStart;
          const data = await res.json();
          const serverDateMs = new Date(data.serverNow).getTime();
          const approxServerNow = serverDateMs + rtt / 2;
          const drift = approxServerNow - clientEnd;
          setClockDriftMs(Math.round(drift));
          setServerTime(new Date(data.serverNow).toLocaleTimeString());
        }
      } catch {
        // ignore
      }
    };

    syncTime();
    const interval = setInterval(syncTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const tabs = [
    { href: "/admin", label: "DASHBOARD" },
    { href: "/admin/event", label: "EVENT CONTROL" },
    { href: "/admin/teams", label: "TEAMS & CARDS" },
    { href: "/admin/hints", label: "HINTS" },
    { href: "/admin/submissions", label: "SUBMISSIONS" },
    { href: "/admin/winner", label: "WINNER REVEAL" },
    { href: "/admin/danger", label: "DANGER ZONE" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* 1. Crimson Admin Mode Strip (Section 11) */}
      <div className="bg-crimson text-paper py-1.5 px-4 rounded-sm border-2 border-ink shadow-hard-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs font-black uppercase tracking-wider select-none no-print">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-ping" />
          <span>ADMIN MODE ACTIVE — ORGANIZER CONSOLE</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          {clockDriftMs !== null && (
            <span>
              CLOCK DRIFT:{" "}
              <span className={Math.abs(clockDriftMs) > 1000 ? "text-gold" : "text-paper"}>
                {clockDriftMs > 0 ? `+${clockDriftMs}` : clockDriftMs}ms
              </span>
            </span>
          )}
          <span>SERVER: {serverTime || "--:--:--"}</span>
          <button
            onClick={handleLogout}
            className="hover:underline font-bold text-cream"
          >
            EXIT ADMIN
          </button>
        </div>
      </div>

      {/* 2. Admin Navigation Bar */}
      <nav
        aria-label="Admin Navigation"
        className="flex flex-wrap gap-2 border-b-2 border-ink pb-3 no-print"
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all border-2 border-ink shadow-hard-sm hover:shadow-hard active:translate-y-0.5 ${
                isActive ? "bg-crimson text-paper" : "bg-cream text-ink hover:bg-cream/80"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* 3. Panel Content */}
      <div>{children}</div>
    </div>
  );
}
