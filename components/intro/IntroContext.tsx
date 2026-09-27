"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DETECTRIX_INTRO_ENTERED_KEY } from "./DetectiveCaseIntro";

interface IntroContextType {
  hasEntered: boolean;
  enterInvestigation: () => void;
}

const IntroContext = createContext<IntroContextType>({
  hasEntered: false,
  enterInvestigation: () => {},
});

export const IntroProvider: React.FC<{
  hasEnteredInitially?: boolean;
  children: React.ReactNode;
}> = ({ hasEnteredInitially = false, children }) => {
  const [hasEntered, setHasEntered] = useState<boolean>(hasEnteredInitially);

  // Check client-side persistent storage on mount
  useEffect(() => {
    try {
      const inStorage =
        localStorage.getItem(DETECTRIX_INTRO_ENTERED_KEY) === "true" ||
        sessionStorage.getItem(DETECTRIX_INTRO_ENTERED_KEY) === "true";
      if (inStorage) {
        setHasEntered(true);
      }
    } catch {}
  }, []);

  const enterInvestigation = useCallback(() => {
    try {
      localStorage.setItem(DETECTRIX_INTRO_ENTERED_KEY, "true");
      sessionStorage.setItem(DETECTRIX_INTRO_ENTERED_KEY, "true");
      sessionStorage.setItem("introSeen", "true");
      document.cookie = `${DETECTRIX_INTRO_ENTERED_KEY}=true; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    setHasEntered(true);
  }, []);

  return (
    <IntroContext.Provider value={{ hasEntered, enterInvestigation }}>
      {children}
    </IntroContext.Provider>
  );
};

export const useIntro = () => useContext(IntroContext);
