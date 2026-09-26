// Cryptographic utilities adhering to S1, S2, S5, S8, S11
// Uses native Node.js crypto for scrypt, timingSafeEqual, and HMAC-SHA256.

import crypto from "node:crypto";

export const SCRYPT_CONFIG = {
  N: 32768, // 2^15
  r: 8,
  p: 1,
  keylen: 32,
  maxmem: 64 * 1024 * 1024,
} as const;

/**
 * Derives a salted, slow hash using scrypt.
 * Output is formatted as URL-safe base64 (base64url).
 */
export function hashWithScrypt(plaintext: string, salt: string): string {
  const derivedKey = crypto.scryptSync(
    plaintext,
    salt,
    SCRYPT_CONFIG.keylen,
    {
      N: SCRYPT_CONFIG.N,
      r: SCRYPT_CONFIG.r,
      p: SCRYPT_CONFIG.p,
      maxmem: SCRYPT_CONFIG.maxmem,
    }
  );
  return derivedKey.toString("base64url");
}

/**
 * Timing-safe string comparison preventing side-channel attacks.
 * Buffers are compared using crypto.timingSafeEqual.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to equalize timing profile before returning false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a random cryptographic salt (16 bytes, base64url).
 */
export function generateSalt(bytes: number = 16): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Hashes an invalid/wrong attempt for duplicate detection.
 * Strictly returns first 16 hex chars of HMAC-SHA256(SESSION_SECRET, attemptCode).
 * Never stores or leaks the raw attempt (Rule S11).
 */
export function hashAttempt(attemptCode: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(attemptCode);
  return hmac.digest("hex").slice(0, 16);
}

/**
 * Constant-work dummy hash execution for rate-limited, invalid, or nonexistent teams.
 * Guarantees S5 constant-time behavior across all code paths.
 */
export function executeConstantWorkDummy(): void {
  const dummySalt = "CONST_WORK_DUMMY_SALT_FIXED";
  hashWithScrypt("DUMMY", dummySalt);
}
