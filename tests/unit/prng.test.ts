import { describe, it, expect } from "vitest";
import { createMulberry32, DEFAULT_BRICK_SEED } from "@/lib/prng";

describe("Mulberry32 PRNG (lib/prng.ts)", () => {
  it("generates deterministic sequences given the identical seed", () => {
    const prng1 = createMulberry32(DEFAULT_BRICK_SEED);
    const prng2 = createMulberry32(DEFAULT_BRICK_SEED);

    for (let i = 0; i < 50; i++) {
      expect(prng1()).toBe(prng2());
    }
  });

  it("produces values strictly in the range [0, 1)", () => {
    const prng = createMulberry32(1234567);
    for (let i = 0; i < 100; i++) {
      const val = prng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("generates different sequences for different seeds", () => {
    const prngA = createMulberry32(111);
    const prngB = createMulberry32(222);

    expect(prngA()).not.toBe(prngB());
  });
});
