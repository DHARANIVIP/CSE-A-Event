// Pure mathematical utilities for rain particle simulation
// Fully unit-tested per Section 7.3

export interface Droplet {
  x: number;
  y: number;
  r: number;
  vy: number;
  wobblePhase: number;
  isSliding: boolean;
  trail: Array<{ x: number; y: number; r: number; alpha: number }>;
}

/**
 * Area-preserving droplet merge logic.
 * If two drops overlap (distance < (r1 + r2) * 0.8), merge into one:
 * - radius: sqrt(r1^2 + r2^2)
 * - y: max(y1, y2) (lower vertical position)
 * - x: weighted average based on area
 * - vy: momentum-weighted average
 */
export function checkAndMergeDrops(
  dropA: Droplet,
  dropB: Droplet
): { merged: boolean; result?: Droplet } {
  const dx = dropA.x - dropB.x;
  const dy = dropA.y - dropB.y;
  const dist = Math.hypot(dx, dy);
  const mergeThreshold = (dropA.r + dropB.r) * 0.8;

  if (dist >= mergeThreshold) {
    return { merged: false };
  }

  const areaA = dropA.r * dropA.r;
  const areaB = dropB.r * dropB.r;
  const totalArea = areaA + areaB;

  const newR = Math.sqrt(totalArea);
  const newX = (dropA.x * areaA + dropB.x * areaB) / totalArea;
  const newY = Math.max(dropA.y, dropB.y);
  const newVy = (dropA.vy * areaA + dropB.vy * areaB) / totalArea;

  const combinedTrail = [...dropA.trail, ...dropB.trail].slice(-20);

  const mergedDrop: Droplet = {
    x: newX,
    y: newY,
    r: newR,
    vy: Math.max(newVy, 0.4),
    wobblePhase: dropA.wobblePhase,
    isSliding: dropA.isSliding || dropB.isSliding || newR > 6.0,
    trail: combinedTrail,
  };

  return { merged: true, result: mergedDrop };
}

/**
 * Adaptive quality step-down state machine.
 * If average frame time over measured window exceeds 22ms (~ <45 fps),
 * step down to lower quality preset to maintain responsiveness.
 * Never steps back up in the same session.
 */
export type QualityLevel = "desktop" | "mobile" | "lowPower";

export function evaluateAdaptiveQuality(
  currentLevel: QualityLevel,
  avgFrameTimeMs: number,
  frameThresholdMs: number = 22
): QualityLevel {
  if (avgFrameTimeMs <= frameThresholdMs) {
    return currentLevel;
  }

  // Degrade monotonically
  if (currentLevel === "desktop") {
    return "mobile";
  }
  if (currentLevel === "mobile") {
    return "lowPower";
  }
  return "lowPower";
}

/**
 * Calculates horizontal drop wobble based on vertical speed and phase.
 */
export function calculateDropWobble(phase: number, vy: number): number {
  return Math.sin(phase) * Math.min(vy * 0.45, 1.2);
}
