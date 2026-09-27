"use client";

import React from "react";
import { DetectiveCaseIntro } from "@/components/intro/DetectiveCaseIntro";
import { useIntro } from "@/components/intro/IntroContext";

interface HomeIntroGateProps {
  hasEnteredInitially?: boolean;
  children: React.ReactNode;
}

/**
 * Gate that displays the cinematic Detective Case Intro page first on initial visit.
 * Upon entering, the entry music plays only once.
 * Once entered, the portal is displayed and the music never replays on refresh or subsequent visits.
 */
export const HomeIntroGate: React.FC<HomeIntroGateProps> = ({ children }) => {
  const { hasEntered, enterInvestigation } = useIntro();

  // If the user has not entered yet, display the Detective Case Intro page first
  if (!hasEntered) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-black">
        <DetectiveCaseIntro onEnterInvestigation={enterInvestigation} />
      </div>
    );
  }

  // Once entered, show the regular Home Portal
  return <>{children}</>;
};

export default HomeIntroGate;
