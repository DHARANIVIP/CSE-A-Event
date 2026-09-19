// Procedural Brick Wall Constants & Palette Tokens
// Matches Section 6: Soft salmon/terracotta-peach running-bond brick wall

export const BRICK_PALETTE = {
  baseColors: [
    "#E7B29A",
    "#E3A78B",
    "#DFA084",
    "#E9B8A1",
    "#D99A7E",
    "#EDBCA6",
  ] as const,
  mortar: "#B9573F",
  mortarShadow: "#A24A35",
  highlightEdge: "rgba(255, 255, 255, 0.28)",
  shadowEdge: "rgba(90, 30, 20, 0.28)",
  pitColor: "rgba(70, 20, 15, 0.35)",
  vignetteInner: "rgba(0, 0, 0, 0)",
  vignetteOuter: "rgba(15, 5, 5, 0.26)",
  gradientOverlayTop: "rgba(0, 0, 0, 0)",
  gradientOverlayBottom: "rgba(0, 0, 0, 0.12)",
};

export const BRICK_GEOMETRY = {
  nominalWidth: 100,
  nominalHeight: 30,
  mortarThickness: 3,
  jitterPosMax: 1.5, // ±1.5px
  jitterSizeRatio: 0.03, // ±3%
  grainAlpha: 0.04, // 4% monochrome noise
  maxDevicePixelRatio: 2,
  resizeDebounceMs: 250,
  resizeThresholdPx: 120,
};

export const BRICK_BRIGHTNESS_LEVELS = [
  { level: 1, overlayOpacity: 0.05, label: "Bright" },
  { level: 2, overlayOpacity: 0.18, label: "Medium" },
  { level: 3, overlayOpacity: 0.32, label: "Soft" },
] as const;

export type BrickBrightnessLevel = 1 | 2 | 3;
