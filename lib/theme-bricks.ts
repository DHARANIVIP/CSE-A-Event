// Procedural Frontier Background Constants & Palette Tokens
// Dark weathered frontier saloon timber & aged tavern masonry

export const BRICK_PALETTE = {
  baseColors: [
    "#261D17",
    "#2D231C",
    "#231B15",
    "#31261F",
    "#292019",
    "#201813",
  ] as const,
  mortar: "#15100C",
  mortarShadow: "#0E0B08",
  highlightEdge: "rgba(255, 235, 200, 0.08)",
  shadowEdge: "rgba(10, 8, 6, 0.45)",
  pitColor: "rgba(12, 9, 7, 0.45)",
  vignetteInner: "rgba(0, 0, 0, 0)",
  vignetteOuter: "rgba(8, 6, 4, 0.55)",
  gradientOverlayTop: "rgba(0, 0, 0, 0.05)",
  gradientOverlayBottom: "rgba(0, 0, 0, 0.35)",
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
