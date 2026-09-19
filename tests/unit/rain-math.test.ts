import { describe, it, expect } from "vitest";
import {
  checkAndMergeDrops,
  evaluateAdaptiveQuality,
  calculateDropWobble,
  Droplet,
} from "@/lib/rain-math";

describe("Rain Math & Particle Physics (lib/rain-math.ts)", () => {
  it("merges overlapping drops with area-preserving radius", () => {
    const dropA: Droplet = {
      x: 100,
      y: 200,
      r: 3,
      vy: 0.5,
      wobblePhase: 0,
      isSliding: false,
      trail: [],
    };

    const dropB: Droplet = {
      x: 102,
      y: 202,
      r: 4,
      vy: 0.8,
      wobblePhase: 0,
      isSliding: false,
      trail: [],
    };

    const merge = checkAndMergeDrops(dropA, dropB);
    expect(merge.merged).toBe(true);
    expect(merge.result).toBeDefined();

    // r = sqrt(3^2 + 4^2) = sqrt(9 + 16) = 5
    expect(merge.result?.r).toBeCloseTo(5.0, 2);
    // y should be the lower position (max y)
    expect(merge.result?.y).toBe(202);
  });

  it("does not merge drops separated beyond threshold", () => {
    const dropA: Droplet = {
      x: 50,
      y: 50,
      r: 3,
      vy: 0.5,
      wobblePhase: 0,
      isSliding: false,
      trail: [],
    };

    const dropB: Droplet = {
      x: 100,
      y: 100,
      r: 3,
      vy: 0.5,
      wobblePhase: 0,
      isSliding: false,
      trail: [],
    };

    const merge = checkAndMergeDrops(dropA, dropB);
    expect(merge.merged).toBe(false);
    expect(merge.result).toBeUndefined();
  });

  it("monotonically steps down quality when frame time exceeds threshold", () => {
    // Normal frame time (16ms = ~60fps) -> maintains level
    expect(evaluateAdaptiveQuality("desktop", 16, 22)).toBe("desktop");

    // Laggy frame time (26ms = ~38fps) -> degrades to mobile
    expect(evaluateAdaptiveQuality("desktop", 26, 22)).toBe("mobile");

    // Laggy mobile (28ms) -> degrades to lowPower
    expect(evaluateAdaptiveQuality("mobile", 28, 22)).toBe("lowPower");

    // Low power stays at lowPower
    expect(evaluateAdaptiveQuality("lowPower", 35, 22)).toBe("lowPower");
  });

  it("calculates horizontal drop wobble bounded by vertical speed", () => {
    const wobble1 = calculateDropWobble(0, 2);
    expect(wobble1).toBeCloseTo(0, 4);

    const wobble2 = calculateDropWobble(Math.PI / 2, 2);
    expect(wobble2).toBeGreaterThan(0);
    expect(wobble2).toBeLessThanOrEqual(1.2);
  });
});
