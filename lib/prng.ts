// Seeded PRNG using the Mulberry32 algorithm
// Provides fast, deterministic pseudo-random numbers so all clients generate the identical procedural brick wall.

export function createMulberry32(seed: number): () => number {
  let s = seed | 0;
  return function mulberry32(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Global fixed seed from event definition
export const DEFAULT_BRICK_SEED = 0x4d595354; // "MYST" in hex
