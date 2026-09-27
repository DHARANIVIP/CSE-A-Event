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

  // Check client-side session storage on mount
  useEffect(() => {
    try {
      const inSession = sessionStorage.getItem(DETECTRIX_INTRO_ENTERED_KEY) === "true";
      if (inSession) {
        setHasEntered(true);
      }
    } catch {}
  }, []);

  const enterInvestigation = useCallback(() => {
    try {
      sessionStorage.setItem(DETECTRIX_INTRO_ENTERED_KEY, "true");
      document.cookie = `${DETECTRIX_INTRO_ENTERED_KEY}=true; path=/; SameSite=Lax`;
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
