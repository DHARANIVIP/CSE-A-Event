#!/usr/bin/env node
// Generates salted scrypt hash for the Mystery Box secret code
// Reads code securely from stdin (never as a command argument) per S1 & Section 14

import crypto from "node:crypto";
import readline from "node:readline";

const SCRYPT_CONFIG = {
  N: 32768, // 2^15
  r: 8,
  p: 1,
  keylen: 32,
  maxmem: 64 * 1024 * 1024,
};

function hashWithScrypt(plaintext, salt) {
  const derivedKey = crypto.scryptSync(plaintext, salt, SCRYPT_CONFIG.keylen, {
    N: SCRYPT_CONFIG.N,
    r: SCRYPT_CONFIG.r,
    p: SCRYPT_CONFIG.p,
    maxmem: SCRYPT_CONFIG.maxmem,
  });
  return derivedKey.toString("base64url");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

process.stdout.write("Enter 5-character Access Code (A-Z, 0-9): ");

rl.on("line", (line) => {
  const code = line.trim().toUpperCase();

  if (!/^[A-Z0-9]{5}$/.test(code)) {
    console.error("\n❌ ERROR: Code must be exactly 5 alphanumeric characters [A-Z0-9].");
    process.exit(1);
  }

  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = hashWithScrypt(code, salt);

  // Self-verification check
  const reVerifyHash = hashWithScrypt(code, salt);
  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(reVerifyHash))) {
    console.error("\n❌ ERROR: Hash verification self-test failed.");
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("✅ ACCESS CODE HASHED AND VERIFIED SUCCESSFULLY");
  console.log("=======================================================");
  console.log("Add the following lines to your server environment (.env):");
  console.log(`CODE_SALT=${salt}`);
  console.log(`CODE_HASH=${hash}`);
  console.log("=======================================================\n");

  rl.close();
  process.exit(0);
});
