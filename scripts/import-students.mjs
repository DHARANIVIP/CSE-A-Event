#!/usr/bin/env node
// =========================================================================
// STUDENT REGISTRATION IMPORT & SUPABASE SEEDING TOOL
// Project ID: izxdhaxxlkfbkkrwdlxo
// Automatically imports exported student data, assigns Team IDs, generates
// secure 6-digit PINs, hashes them with scrypt, and seeds the Supabase database.
// =========================================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local if present
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  });
}

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

const inputFile = process.argv[2];

if (!inputFile) {
  console.log(`
Usage:
  node scripts/import-students.mjs <exported-students.csv> [options]

Arguments:
  <exported-students.csv>   Path to the exported CSV from the main coordinator

Options:
  --prefix <PREFIX>         Custom Team ID prefix (e.g. TEAM, CSEA, DETECT). Default: TEAM
  --dry-run                 Test parse and generate passwords without inserting into database

Example:
  node scripts/import-students.mjs student-export.csv
  node scripts/import-students.mjs student-export.csv --prefix CSEA
`);
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run");
const prefixIndex = process.argv.indexOf("--prefix");
const teamPrefix = prefixIndex !== -1 && process.argv[prefixIndex + 1] ? process.argv[prefixIndex + 1].toUpperCase() : "TEAM";

const supabaseUrl = process.env.SUPABASE_URL || "https://izxdhaxxlkfbkkrwdlxo.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!isDryRun && (!supabaseKey || supabaseKey.includes("test_service") || supabaseKey.includes("mock"))) {
  console.error("\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is required in your .env.local file.");
  console.error("Please retrieve your service_role secret from Supabase Dashboard: Project Settings -> API.\n");
  process.exit(1);
}

const supabase = !isDryRun ? createClient(supabaseUrl, supabaseKey) : null;

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const filePath = path.resolve(process.cwd(), inputFile);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");
  const rawLines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (rawLines.length === 0) {
    console.error("❌ The file is empty.");
    process.exit(1);
  }

  const header = parseCSVLine(rawLines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  
  // Find column indexes flexibly
  let teamIdIdx = header.findIndex((h) => h === "teamid" || h === "id");
  let teamNameIdx = header.findIndex((h) => h === "teamname" || h === "team" || h === "name");
  let membersIdx = header.findIndex((h) => h.includes("member") || h.includes("student") || h.includes("names"));
  let pinIdx = header.findIndex((h) => h === "pin" || h === "password" || h === "pass");

  // Fallback if header is not standard
  if (teamNameIdx === -1 && header.length >= 1) teamNameIdx = 0;
  if (membersIdx === -1 && header.length >= 2) membersIdx = 1;

  console.log("\n==========================================================================");
  console.log(`🚀 IMPORTING REGISTRATIONS FOR DETECTRIX (Project: izxdhaxxlkfbkkrwdlxo)`);
  console.log(`📁 Source file: ${inputFile}`);
  console.log(`⚙️ Mode: ${isDryRun ? "DRY RUN (No database write)" : "LIVE DATABASE INSERT"}`);
  console.log(`🏷️ Team ID Prefix: ${teamPrefix}`);
  console.log("==========================================================================\n");

  const seededTeams = [];
  let autoIndex = 1;

  for (let i = 1; i < rawLines.length; i++) {
    const row = parseCSVLine(rawLines[i]);
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    // 1. Team Name
    let teamName = (teamNameIdx !== -1 && row[teamNameIdx]) ? row[teamNameIdx] : `Investigation Squad ${autoIndex}`;
    teamName = teamName.replace(/^["']|["']$/g, "").trim();

    // 2. Team ID
    let teamId = (teamIdIdx !== -1 && row[teamIdIdx]) ? row[teamIdIdx].toUpperCase().replace(/[^A-Z0-9-]/g, "") : "";
    if (!teamId) {
      teamId = `${teamPrefix}-${String(autoIndex).padStart(2, "0")}`;
    }

    // 3. Members
    let members = [];
    if (membersIdx !== -1 && row[membersIdx]) {
      members = row[membersIdx]
        .split(/[;,|]/)
        .map((m) => m.trim().replace(/^["']|["']$/g, ""))
        .filter((m) => m.length > 0);
    }
    // Also capture any remaining trailing columns as individual members if format is: TeamName, Member1, Member2, Member3
    if (members.length === 0 && row.length > 1) {
      members = row.slice(1).map((m) => m.trim()).filter((m) => m.length > 0);
    }

    // 4. 6-Digit PIN Password
    let pin = (pinIdx !== -1 && row[pinIdx]) ? row[pinIdx].replace(/\D/g, "") : "";
    if (!pin || pin.length !== 6) {
      pin = Math.floor(100000 + crypto.randomInt(900000)).toString();
    }

    // 5. Scrypt Hash
    const salt = crypto.randomBytes(16).toString("base64url");
    const pinHash = hashPin(pin, salt);

    if (!isDryRun && supabase) {
      const { error } = await supabase.from("teams").upsert({
        id: teamId,
        name: teamName,
        members,
        pin_hash: pinHash,
        disabled: false,
      });

      if (error) {
        console.error(`❌ Failed to insert ${teamId} (${teamName}):`, error.message);
        continue;
      }
    }

    seededTeams.push({
      "Team ID": teamId,
      "Team Name": teamName,
      "PIN (Password)": pin,
      "Members": members.join(", "),
    });

    autoIndex++;
  }

  // Write printable export CSV for coordinators
  const exportCsvPath = path.resolve(process.cwd(), "teams-credentials-export.csv");
  const exportCsvRows = [
    "Team ID,Team Name,PIN Password,Members",
    ...seededTeams.map((t) => `"${t["Team ID"]}","${t["Team Name"]}","${t["PIN (Password)"]}","${t["Members"]}"`),
  ].join("\n");
  fs.writeFileSync(exportCsvPath, exportCsvRows, "utf-8");

  console.log("✅ Credentials table generated successfully:\n");
  console.table(seededTeams);

  console.log("\n==========================================================================");
  console.log(`🎉 Total Teams Processed: ${seededTeams.length}`);
  console.log(`📄 Exported Handout File: ${exportCsvPath}`);
  console.log("🔒 You can distribute 'teams-credentials-export.csv' to the team leads!");
  console.log("==========================================================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
