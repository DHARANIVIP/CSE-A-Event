#!/usr/bin/env node
// Generates salted scrypt hash for the Admin portal password
// Reads password securely from stdin per Section 14

import crypto from "node:crypto";
import readline from "node:readline";

const SCRYPT_CONFIG = {
  N: 32768,
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
  return `${salt}:${derivedKey.toString("base64url")}`;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

process.stdout.write("Enter Admin Password: ");

rl.on("line", (line) => {
  const password = line.trim();

  if (password.length < 8) {
    console.error("\n❌ ERROR: Admin password should be at least 8 characters.");
    process.exit(1);
  }

  const salt = crypto.randomBytes(16).toString("base64url");
  const storedHash = hashWithScrypt(password, salt);

  console.log("\n=======================================================");
  console.log("✅ ADMIN PASSWORD HASHED SUCCESSFULLY");
  console.log("=======================================================");
  console.log("Add the following line to your server environment (.env):");
  console.log(`ADMIN_PASSWORD_HASH=${storedHash}`);
  console.log("=======================================================\n");

  rl.close();
  process.exit(0);
});
