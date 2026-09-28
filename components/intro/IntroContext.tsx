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
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const inSession = sessionStorage.getItem(DETECTRIX_INTRO_ENTERED_KEY);
        if (inSession !== null) {
          return inSession === "true";
        }
      } catch {}
    }
    return hasEnteredInitially;
  });

  // Check client-side session storage on mount & clean up legacy persistent storage
  useEffect(() => {
    try {
      // Clear legacy localStorage to ensure fresh visits upon reopening link
      localStorage.removeItem(DETECTRIX_INTRO_ENTERED_KEY);
      localStorage.removeItem("detectrix_intro_entered");
      localStorage.removeItem("detectrix_intro_entered_v2");
      document.cookie = `${DETECTRIX_INTRO_ENTERED_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

      const inSession = sessionStorage.getItem(DETECTRIX_INTRO_ENTERED_KEY) === "true";
      if (inSession) {
        setHasEntered(true);
      }
    } catch {}
  }, []);

  const enterInvestigation = useCallback(() => {
    try {
      sessionStorage.setItem(DETECTRIX_INTRO_ENTERED_KEY, "true");
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
