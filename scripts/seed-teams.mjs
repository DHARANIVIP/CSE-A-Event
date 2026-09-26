#!/usr/bin/env node
// Seeds teams from CSV into Supabase database with scrypt PIN hashing
// Prints team credential cards table to stdout exactly once and leaves no credentials on disk.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SCRYPT_CONFIG = {
  N: 32768,
  r: 8,
  p: 1,
  keylen: 32,
  maxmem: 64 * 1024 * 1024,
};

function hashPin(pin, salt) {
  const derivedKey = crypto.scryptSync(pin, salt, SCRYPT_CONFIG.keylen, {
    N: SCRYPT_CONFIG.N,
    r: SCRYPT_CONFIG.r,
    p: SCRYPT_CONFIG.p,
    maxmem: SCRYPT_CONFIG.maxmem,
  });
  return `${salt}:${derivedKey.toString("base64url")}`;
}

const csvFile = process.argv[2];
if (!csvFile) {
  console.log("Usage: node scripts/seed-teams.mjs <teams.csv>");
  console.log("CSV format: team_id,team_name,member1;member2,optional_6digit_pin");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const content = fs.readFileSync(path.resolve(process.cwd(), csvFile), "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const seededTeams = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.toLowerCase().includes("team")) continue;

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) continue;

    const teamId = parts[0].toUpperCase();
    const teamName = parts[1];
    const members = parts[2] ? parts[2].split(";").map((m) => m.trim()) : [];
    let pin = parts[3] || "";

    if (!pin) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const salt = crypto.randomBytes(16).toString("base64url");
    const pinHash = hashPin(pin, salt);

    const { error } = await supabase.from("teams").upsert({
      id: teamId,
      name: teamName,
      members,
      pin_hash: pinHash,
      disabled: false,
    });

    if (error) {
      console.error(`❌ Failed to insert team ${teamId}:`, error.message);
    } else {
      seededTeams.push({ id: teamId, name: teamName, pin });
    }
  }

  console.log("\n==========================================================================");
  console.log("           OFFICIAL TEAM ACCESS PASSWORDS (PRINT ONCE)");
  console.log("==========================================================================");
  console.table(seededTeams);
  console.log("==========================================================================");
  console.log(`Successfully imported ${seededTeams.length} teams.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
