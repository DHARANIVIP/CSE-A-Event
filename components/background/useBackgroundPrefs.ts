"use client";

import { useState, useEffect } from "react";
import { BrickBrightnessLevel, BRICK_BRIGHTNESS_LEVELS } from "@/lib/theme-bricks";

export interface BackgroundPreferences {
  rainEnabled: boolean;
  brickBrightness: BrickBrightnessLevel;
  setRainEnabled: (enabled: boolean) => void;
  cycleBrightness: () => void;
  overlayOpacity: number;
}

export function useBackgroundPrefs(): BackgroundPreferences {
  const [rainEnabled, setRainEnabledState] = useState(false);
  const [brickBrightness, setBrickBrightness] = useState<BrickBrightnessLevel>(2);

  useEffect(() => {
    try {
      // Check reduced motion preference or stored setting
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setRainEnabledState(false);
      } else {
        const storedRain = localStorage.getItem("mb_rain_enabled");
        if (storedRain !== null) {
          setRainEnabledState(storedRain === "true");
        } else {
          setRainEnabledState(false);
        }
      }

      const storedBrightness = localStorage.getItem("mb_brick_brightness");
      if (storedBrightness) {
        const parsed = Number(storedBrightness) as BrickBrightnessLevel;
        if ([1, 2, 3].includes(parsed)) {
          setBrickBrightness(parsed);
        }
      }
    } catch {
      // localStorage access failed (e.g. strict security mode)
    }
  }, []);

  const setRainEnabled = (enabled: boolean) => {
    setRainEnabledState(enabled);
    try {
      localStorage.setItem("mb_rain_enabled", String(enabled));
    } catch {
      // ignore
    }
  };

  const cycleBrightness = () => {
    const next: BrickBrightnessLevel = brickBrightness === 3 ? 1 : ((brickBrightness + 1) as BrickBrightnessLevel);
    setBrickBrightness(next);
    try {
      localStorage.setItem("mb_brick_brightness", String(next));
    } catch {
      // ignore
    }
  };

  const activeLevel = BRICK_BRIGHTNESS_LEVELS.find((l) => l.level === brickBrightness) || BRICK_BRIGHTNESS_LEVELS[1];

  return {
    rainEnabled,
    brickBrightness,
    setRainEnabled,
    cycleBrightness,
    overlayOpacity: activeLevel.overlayOpacity,
  };
}
