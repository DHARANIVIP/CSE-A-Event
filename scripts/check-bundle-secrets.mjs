#!/usr/bin/env node
// Security scanner enforcing Rule S1 & S14
// Scans client-facing static build artifacts in .next/ for leaked secrets or raw codes.

import fs from "node:fs";
import path from "node:path";

const NEXT_DIR = path.resolve(process.cwd(), ".next");
const STATIC_DIR = path.join(NEXT_DIR, "static");

console.log("🔍 Scanning .next client bundle for secret leakages (Rule S14)...");

if (!fs.existsSync(NEXT_DIR)) {
  console.log("ℹ️  .next directory not found (skipping bundle scan until build).");
  process.exit(0);
}

// Target secrets to look for
const forbiddenPatterns = [];

if (process.env.CODE_HASH) {
  forbiddenPatterns.push({ name: "CODE_HASH", value: process.env.CODE_HASH });
}
if (process.env.CODE_SALT) {
  forbiddenPatterns.push({ name: "CODE_SALT", value: process.env.CODE_SALT });
}
if (process.env.SESSION_SECRET) {
  forbiddenPatterns.push({ name: "SESSION_SECRET", value: process.env.SESSION_SECRET });
}
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  forbiddenPatterns.push({
    name: "SUPABASE_SERVICE_ROLE_KEY",
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
if (process.env.CHECK_CODE) {
  forbiddenPatterns.push({ name: "CHECK_CODE (Plaintext Answer)", value: process.env.CHECK_CODE });
}

// Always check for common secret keywords in static chunks
const keywordsToDetect = [
  "SERVICE_ROLE_KEY",
  "CODE_SALT=",
  "CODE_HASH=",
];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const violations = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Don't scan server-only chunks (.next/server) as server is allowed to hold secrets
      if (entry.name === "server") {
        continue;
      }
      violations.push(...scanDirectory(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".js") || entry.name.endsWith(".json") || entry.name.endsWith(".html"))
    ) {
      const content = fs.readFileSync(fullPath, "utf-8");

      for (const pattern of forbiddenPatterns) {
        if (pattern.value && pattern.value.length >= 5 && content.includes(pattern.value)) {
          violations.push({
            file: path.relative(process.cwd(), fullPath),
            secret: pattern.name,
          });
        }
      }

      for (const keyword of keywordsToDetect) {
        if (content.includes(keyword)) {
          violations.push({
            file: path.relative(process.cwd(), fullPath),
            secret: `Keyword: ${keyword}`,
          });
        }
      }
    }
  }

  return violations;
}

const targetDir = fs.existsSync(STATIC_DIR) ? STATIC_DIR : NEXT_DIR;
const violations = scanDirectory(targetDir);

if (violations.length > 0) {
  console.error("\n❌ CRITICAL SECURITY VIOLATION: Secret values found in client bundle:");
  for (const v of violations) {
    console.error(`   - Leaked: ${v.secret} in ${v.file}`);
  }
  process.exit(1);
}

console.log("✅ Bundle scan passed: Zero secrets or plain codes found in client assets.\n");
process.exit(0);
