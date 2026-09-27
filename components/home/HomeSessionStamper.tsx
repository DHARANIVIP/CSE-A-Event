"use client";

import { useEffect } from "react";

export const HomeSessionStamper: React.FC = () => {
  useEffect(() => {
    try {
      sessionStorage.setItem("detectrix_intro_seen", "true");
      document.cookie = "detectrix_intro_seen=true; path=/; SameSite=Lax";
    } catch {}
  }, []);

  return null;
};
