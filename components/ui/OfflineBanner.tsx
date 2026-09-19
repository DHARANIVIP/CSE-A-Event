"use client";

import React, { useState, useEffect } from "react";

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Offline status"
      className="bg-danger text-paper py-2 px-4 border-b-3 border-ink font-mono text-xs sm:text-sm font-bold text-center tracking-wider sticky top-0 z-50 flex items-center justify-center gap-2"
    >
      <span className="w-2 h-2 rounded-full bg-paper animate-ping" />
      <span>YOU ARE OFFLINE. INVESTIGATE LOCAL FILES OR SUBMIT VIA EMERGENCY DESK.</span>
    </aside>
  );
};
