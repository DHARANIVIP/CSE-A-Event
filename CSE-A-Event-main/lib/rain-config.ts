// Rain Particle System Configuration & Presets
// Implements specs in Section 7.1

export interface RainLayerConfig {
  far: number;
  mid: number;
  near: number;
}

export interface RainConfig {
  streaks: RainLayerConfig;
  wind: number; // slant (negative = right to left)
  speed: {
    far: [number, number];
    mid: [number, number];
    near: [number, number];
  };
  length: {
    far: [number, number];
    mid: [number, number];
    near: [number, number];
  };
  width: {
    far: number;
    mid: number;
    near: number;
  };
  alpha: {
    far: number;
    mid: number;
    near: number;
  };
  drops: {
    max: number;
    spawnPerSec: number;
    radius: [number, number];
    growthPerSec: number;
    slideThresholdRadius: number;
  };
  trail: {
    chance: number;
    slideSpeed: [number, number];
    fade: number;
  };
  splash: {
    chancePerSec: number;
    maxRadius: number;
    lifeMs: number;
  };
  lightning: {
    enabled: boolean;
    minGapSec: number;
    maxGapSec: number;
    flashMs: number;
    alpha: number;
  };
}

export const RAIN_DESKTOP_CONFIG: RainConfig = {
  streaks: { far: 70, mid: 60, near: 30 },
  wind: -0.18,
  speed: {
    far: [7, 10],
    mid: [12, 17],
    near: [20, 28],
  },
  length: {
    far: [10, 18],
    mid: [18, 30],
    near: [30, 52],
  },
  width: {
    far: 0.6,
    mid: 1.0,
    near: 1.6,
  },
  alpha: {
    far: 0.1,
    mid: 0.18,
    near: 0.3,
  },
  drops: {
    max: 55,
    spawnPerSec: 3.5,
    radius: [2.2, 7.5],
    growthPerSec: 0.25,
    slideThresholdRadius: 6.0,
  },
  trail: {
    chance: 0.0009,
    slideSpeed: [0.3, 1.6],
    fade: 0.985,
  },
  splash: {
    chancePerSec: 1.2,
    maxRadius: 14,
    lifeMs: 500,
  },
  lightning: {
    enabled: false,
    minGapSec: 60,
    maxGapSec: 120,
    flashMs: 120,
    alpha: 0.04,
  },
};

export const RAIN_MOBILE_CONFIG: RainConfig = {
  ...RAIN_DESKTOP_CONFIG,
  streaks: { far: 32, mid: 26, near: 14 },
  drops: {
    ...RAIN_DESKTOP_CONFIG.drops,
    max: 24,
    spawnPerSec: 1.8,
  },
  lightning: {
    ...RAIN_DESKTOP_CONFIG.lightning,
    enabled: false,
  },
};

export const RAIN_LOW_POWER_CONFIG: RainConfig = {
  ...RAIN_DESKTOP_CONFIG,
  streaks: { far: 18, mid: 14, near: 8 },
  drops: {
    ...RAIN_DESKTOP_CONFIG.drops,
    max: 12,
    spawnPerSec: 0.8,
  },
  trail: {
    ...RAIN_DESKTOP_CONFIG.trail,
    chance: 0.0001,
  },
  lightning: {
    ...RAIN_DESKTOP_CONFIG.lightning,
    enabled: false,
  },
};

export type RainPreset = "desktop" | "mobile" | "lowPower";
