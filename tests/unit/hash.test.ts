import { describe, it, expect } from "vitest";
import {
  hashWithScrypt,
  timingSafeEqualString,
  generateSalt,
  hashAttempt,
} from "@/lib/hash";

describe("Cryptographic Helpers (lib/hash.ts)", () => {
  it("generates deterministic scrypt hashes with the same salt", () => {
    const salt = "TEST_SALT_123456";
    const code = "ABCDE";
    const hash1 = hashWithScrypt(code, salt);
    const hash2 = hashWithScrypt(code, salt);

    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe("string");
    expect(hash1.length).toBeGreaterThan(16);
  });

  it("produces different hashes for different codes or salts", () => {
    const salt1 = "SALT_ALPHA";
    const salt2 = "SALT_BETA";
    const code1 = "AAAAA";
    const code2 = "BBBBB";

    expect(hashWithScrypt(code1, salt1)).not.toBe(hashWithScrypt(code2, salt1));
    expect(hashWithScrypt(code1, salt1)).not.toBe(hashWithScrypt(code1, salt2));
  });

  it("correctly compares strings in constant time with timingSafeEqualString", () => {
    const target = "SECRET_TOKEN_XYZ_123";
    expect(timingSafeEqualString(target, target)).toBe(true);
    expect(timingSafeEqualString(target, "SECRET_TOKEN_XYZ_124")).toBe(false);
    expect(timingSafeEqualString(target, "SHORT")).toBe(false);
    expect(timingSafeEqualString(target, "")).toBe(false);
  });

  it("hashes wrong attempts into truncated 16-hex HMACs (Rule S11)", () => {
    const secret = "SUPER_SECRET_KEY_FOR_TESTS_123456789";
    const attempt1 = "WRONG1";
    const attempt2 = "WRONG2";

    const hash1 = hashAttempt(attempt1, secret);
    const hash2 = hashAttempt(attempt2, secret);

    expect(hash1).toHaveLength(16);
    expect(hash2).toHaveLength(16);
    expect(hash1).toMatch(/^[0-9a-f]{16}$/);
    expect(hash1).not.toBe(hash2);
  });

  it("generates cryptographically random salts of requested length", () => {
    const salt1 = generateSalt(16);
    const salt2 = generateSalt(16);

    expect(salt1).not.toBe(salt2);
    expect(salt1.length).toBeGreaterThanOrEqual(16);
  });
});
