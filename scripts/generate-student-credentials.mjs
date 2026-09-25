#!/usr/bin/env node
// =========================================================================
// STUDENT CREDENTIALS GENERATOR & EXCEL/CSV EXPORT TOOL
// DETECTRIX 2026 – The Digital Case Event Portal
// Generates passwords for students/teams based on Register Numbers or Emails,
// creates distribution CSV/Excel files, and optionally seeds Supabase.
// =========================================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Load .env.local if present
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

// Generate memorable 8-character secure password (e.g. DTX#4829 or Spider#2026)
function generateMemorablePassword(seed) {
  const specialChars = ["#", "@", "!", "$"];
  const char = specialChars[crypto.randomInt(specialChars.length)];
  const num = crypto.randomInt(1000, 9999);
  return `DTX${char}${num}`;
}

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

function cleanCell(val) {
  if (!val) return "";
  return val.replace(/^["']|["']$/g, "").trim();
}

const args = process.argv.slice(2);
const inputFile = args.find((a) => !a.startsWith("--")) || "content/coordinator-registration-template.csv";
const isSeedSupabase = args.includes("--seed");
const customUrl = args.find((a, i) => args[i - 1] === "--url") || "http://localhost:3000/enter";

const supabaseUrl = process.env.SUPABASE_URL || "https://izxdhaxxlkfbkkrwdlxo.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = isSeedSupabase && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function run() {
  const resolvedInput = path.resolve(process.cwd(), inputFile);
  if (!fs.existsSync(resolvedInput)) {
    console.error(`❌ Input file not found: ${resolvedInput}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(resolvedInput, "utf-8");
  const lines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    console.error("❌ The specified CSV file is empty.");
    process.exit(1);
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const findIdx = (...keys) => headers.findIndex((h) => keys.some((k) => h === k || h.includes(k)));

  const leaderNameIdx = findIdx("leadername", "studentname", "fullname", "leader");
  const teamNameIdx = findIdx("teamname", "team");
  const teamIdIdx = findIdx("teamid", "id");
  const regNoIdx = findIdx("leaderreg", "regno", "registerno", "rollno", "registernumber");
  const emailIdx = findIdx("email", "leaderemail", "studentemail");
  const passwordIdx = findIdx("password", "pass", "pin");
  const mobileIdx = findIdx("mobile", "phone");
  const sectionIdx = findIdx("section");
  const genderIdx = findIdx("gender");

  console.log("\n==========================================================================");
  console.log("🔐 DETECTRIX STUDENT CREDENTIALS & SPREADSHEET GENERATOR");
  console.log(`📁 Source: ${inputFile}`);
  console.log(`🌐 Target Portal URL: ${customUrl}`);
  console.log(`⚡ Supabase Live Seed: ${isSeedSupabase ? "ENABLED" : "DISABLED (Preview Only)"}`);
  console.log("==========================================================================\n");

  const exportRows = [];
  let autoIndex = 1;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (!row.some((cell) => cell.length > 0)) continue;

    const teamId = cleanCell(teamIdIdx !== -1 ? row[teamIdIdx] : "") || `DTX-${String(autoIndex).padStart(2, "0")}`;
    const teamName = cleanCell(teamNameIdx !== -1 ? row[teamNameIdx] : "") || `Squad ${autoIndex}`;
    const studentName = cleanCell(leaderNameIdx !== -1 ? row[leaderNameIdx] : "") || `Student ${autoIndex}`;
    const regNo = cleanCell(regNoIdx !== -1 ? row[regNoIdx] : "") || `REG-${1000 + autoIndex}`;
    const email = cleanCell(emailIdx !== -1 ? row[emailIdx] : "");
    const mobile = cleanCell(mobileIdx !== -1 ? row[mobileIdx] : "");
    const section = cleanCell(sectionIdx !== -1 ? row[sectionIdx] : "A");
    const gender = cleanCell(genderIdx !== -1 ? row[genderIdx] : "Unspecified");

    // Existing password or generate new
    let password = cleanCell(passwordIdx !== -1 ? row[passwordIdx] : "");
    if (!password || password.length < 4) {
      password = generateMemorablePassword(regNo || email);
    }

    // Scrypt hash for database
    const salt = crypto.randomBytes(16).toString("base64url");
    const pinHash = hashPin(password, salt);

    if (isSeedSupabase && supabase) {
      const { error } = await supabase.from("teams").upsert({
        id: teamId.toUpperCase(),
        name: teamName,
        leader_name: studentName,
        leader_reg_no: regNo,
        leader_email: email,
        leader_mobile: mobile,
        leader_gender: gender,
        leader_section: section,
        pin_hash: pinHash,
        disabled: false,
      });

      if (error) {
        console.error(`⚠️ Failed to upsert ${teamId} into Supabase:`, error.message);
      }
    }

    exportRows.push({
      "Team ID": teamId.toUpperCase(),
      "Team Name": teamName,
      "Student Name": studentName,
      "Register Number": regNo,
      "Email ID": email,
      "Password": password,
      "Login URL": customUrl,
      "Email Status": "PENDING",
    });

    autoIndex++;
  }

  // 1. Write the Google Sheets / Excel distribution file
  const distCsvPath = path.resolve(process.cwd(), "content/student-credentials-distribution.csv");
  const headersList = [
    "Team ID",
    "Team Name",
    "Student Name",
    "Register Number",
    "Email ID",
    "Password",
    "Login URL",
    "Email Status",
  ];

  const csvContent = [
    headersList.join(","),
    ...exportRows.map((r) =>
      headersList.map((h) => `"${(r[h] || "").toString().replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  fs.writeFileSync(distCsvPath, csvContent, "utf-8");

  // Also update root teams-credentials-export.csv
  const rootExportPath = path.resolve(process.cwd(), "teams-credentials-export.csv");
  fs.writeFileSync(rootExportPath, csvContent, "utf-8");

  console.log("✅ Credentials Generated Successfully:\n");
  console.table(exportRows);

  console.log("\n==========================================================================");
  console.log(`📄 Exported Distribution File: ${distCsvPath}`);
  console.log(`📄 Mirrored Root File:        ${rootExportPath}`);
  console.log(`📊 Total Records Processed:   ${exportRows.length}`);
  console.log("==========================================================================");
  console.log("\n💡 Next Steps:");
  console.log("1. Open Google Sheets and import 'content/student-credentials-distribution.csv'.");
  console.log("2. Open Extensions -> Apps Script and paste the code from 'scripts/google-apps-script-mailer.js'.");
  console.log("3. Click 'Run' to email all students their Register Number & Password instantly!\n");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
