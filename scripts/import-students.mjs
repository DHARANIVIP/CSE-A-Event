#!/usr/bin/env node
// =========================================================================
// STUDENT REGISTRATION IMPORT & SUPABASE SEEDING TOOL
// Project ID: izxdhaxxlkfbkkrwdlxo
// Automatically imports exported student data matching the exact Detectrix
// registration form (Team Name, Leader, Members, Section, Password).
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
  <exported-students.csv>   Path to the exported CSV from the coordinator registration website

Options:
  --prefix <PREFIX>         Custom Team ID prefix (e.g. DTX, TEAM, CSEA). Default: DTX
  --dry-run                 Test parse and show credentials without inserting into database

Example:
  node scripts/import-students.mjs coordinator-export.csv
  node scripts/import-students.mjs coordinator-export.csv --dry-run
`);
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run");
const prefixIndex = process.argv.indexOf("--prefix");
const teamPrefix = prefixIndex !== -1 && process.argv[prefixIndex + 1] ? process.argv[prefixIndex + 1].toUpperCase() : "DTX";

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

function cleanCell(val) {
  if (!val) return "";
  return val.replace(/^["']|["']$/g, "").trim();
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

  const rawHeaders = parseCSVLine(rawLines[0]);
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  console.log("\n==========================================================================");
  console.log(`🚀 IMPORTING REGISTRATIONS FOR DETECTRIX 2ND YEAR`);
  console.log(`Supabase Project: izxdhaxxlkfbkkrwdlxo (${supabaseUrl})`);
  console.log(`📁 Source file: ${inputFile}`);
  console.log(`⚙️ Mode: ${isDryRun ? "DRY RUN (Preview Only)" : "LIVE DATABASE INSERT"}`);
  console.log(`🏷️ Team ID Prefix: ${teamPrefix}`);
  console.log("==========================================================================\n");

  const seededTeams = [];
  let autoIndex = 1;

  // Header detection helpers
  const findIdx = (...keys) => {
    return headers.findIndex((h) => keys.some((k) => h === k || h.includes(k)));
  };

  const teamNameIdx = findIdx("teamname", "team", "name");
  const teamIdIdx = findIdx("teamid", "id");
  const leaderNameIdx = findIdx("leadername", "fullname", "leader");
  const leaderRegIdx = findIdx("leaderreg", "registernumber", "regno", "rollno");
  const leaderEmailIdx = findIdx("email", "leaderemail");
  const leaderMobileIdx = findIdx("mobile", "phone");
  const leaderGenderIdx = findIdx("gender");
  const leaderSectionIdx = findIdx("section");
  const passwordIdx = findIdx("password", "pass", "pin");

  // Specific member column pairs if present: member2name, member2regno, etc.
  const m2NameIdx = findIdx("member2name", "member2");
  const m2RegIdx = findIdx("member2reg", "member2regno");
  const m3NameIdx = findIdx("member3name", "member3");
  const m3RegIdx = findIdx("member3reg", "member3regno");
  const m4NameIdx = findIdx("member4name", "member4");
  const m4RegIdx = findIdx("member4reg", "member4regno");
  const membersGenericIdx = findIdx("members", "students", "teamleadermembers");

  for (let i = 1; i < rawLines.length; i++) {
    const row = parseCSVLine(rawLines[i]);
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    // 1. Team Name & Team ID
    let teamName = cleanCell(teamNameIdx !== -1 ? row[teamNameIdx] : `Team ${autoIndex}`);
    if (!teamName) teamName = `Team ${autoIndex}`;

    let teamId = cleanCell(teamIdIdx !== -1 ? row[teamIdIdx] : "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!teamId) {
      teamId = `${teamPrefix}-${String(autoIndex).padStart(2, "0")}`;
    }

    // 2. Team Leader Details (Section 02 of registration form)
    const leaderName = cleanCell(leaderNameIdx !== -1 ? row[leaderNameIdx] : "");
    const leaderRegNo = cleanCell(leaderRegIdx !== -1 ? row[leaderRegIdx] : "");
    const leaderEmail = cleanCell(leaderEmailIdx !== -1 ? row[leaderEmailIdx] : "");
    const leaderMobile = cleanCell(leaderMobileIdx !== -1 ? row[leaderMobileIdx] : "");
    const leaderGender = cleanCell(leaderGenderIdx !== -1 ? row[leaderGenderIdx] : "");
    const leaderSection = cleanCell(leaderSectionIdx !== -1 ? row[leaderSectionIdx] : "");

    // 3. Squad Members (Section 03 of registration form)
    const membersList = [];

    // Add leader as first member if specified
    if (leaderName || leaderRegNo) {
      membersList.push({
        role: "Leader",
        name: leaderName || "Team Leader",
        reg_no: leaderRegNo || "",
      });
    }

    // Check individual member columns
    if (m2NameIdx !== -1 && cleanCell(row[m2NameIdx])) {
      membersList.push({
        role: "Member 2",
        name: cleanCell(row[m2NameIdx]),
        reg_no: cleanCell(m2RegIdx !== -1 ? row[m2RegIdx] : ""),
      });
    }
    if (m3NameIdx !== -1 && cleanCell(row[m3NameIdx])) {
      membersList.push({
        role: "Member 3",
        name: cleanCell(row[m3NameIdx]),
        reg_no: cleanCell(m3RegIdx !== -1 ? row[m3RegIdx] : ""),
      });
    }
    if (m4NameIdx !== -1 && cleanCell(row[m4NameIdx])) {
      membersList.push({
        role: "Member 4",
        name: cleanCell(row[m4NameIdx]),
        reg_no: cleanCell(m4RegIdx !== -1 ? row[m4RegIdx] : ""),
      });
    }

    // Fallback if members are listed in a single column separated by semicolons
    if (membersList.length <= 1 && membersGenericIdx !== -1 && cleanCell(row[membersGenericIdx])) {
      const genericNames = cleanCell(row[membersGenericIdx]).split(/[;,|]/);
      genericNames.forEach((n, idx) => {
        const cleanN = n.trim();
        if (cleanN && !membersList.some((m) => m.name.toLowerCase() === cleanN.toLowerCase())) {
          membersList.push({
            role: `Member ${idx + 2}`,
            name: cleanN,
            reg_no: "",
          });
        }
      });
    }

    // 4. Password (Section 04 of registration form)
    let password = cleanCell(passwordIdx !== -1 ? row[passwordIdx] : "");
    if (!password || password.length < 4) {
      // Auto-generate secure 8-character password if missing
      password = Math.floor(10000000 + crypto.randomInt(90000000)).toString();
    }

    // 5. Scrypt Hash
    const salt = crypto.randomBytes(16).toString("base64url");
    const pinHash = hashPin(password, salt);

    if (!isDryRun && supabase) {
      const { error } = await supabase.from("teams").upsert({
        id: teamId,
        name: teamName,
        leader_name: leaderName,
        leader_reg_no: leaderRegNo,
        leader_email: leaderEmail,
        leader_mobile: leaderMobile,
        leader_gender: leaderGender,
        leader_section: leaderSection,
        members: membersList,
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
      "Leader Name": leaderName || "—",
      "Leader Reg No": leaderRegNo || "—",
      "Section": leaderSection || "—",
      "Squad Size": membersList.length,
      "Password": password,
    });

    autoIndex++;
  }

  // Export clean credentials file for distribution
  const exportCsvPath = path.resolve(process.cwd(), "teams-credentials-export.csv");
  const exportRows = [
    "Team ID,Team Name,Leader Name,Leader Reg No,Section,Squad Size,Password",
    ...seededTeams.map((t) =>
      `"${t["Team ID"]}","${t["Team Name"]}","${t["Leader Name"]}","${t["Leader Reg No"]}","${t["Section"]}","${t["Squad Size"]}","${t["Password"]}"`
    ),
  ].join("\n");
  fs.writeFileSync(exportCsvPath, exportRows, "utf-8");

  console.log("✅ Team registration credentials processed:\n");
  console.table(seededTeams);

  console.log("\n==========================================================================");
  console.log(`🎉 Total Teams Processed: ${seededTeams.length}`);
  console.log(`📄 Exported Handout File: ${exportCsvPath}`);
  console.log("🔒 Teams can log in using either their Team ID or Leader Register Number + Password!");
  console.log("==========================================================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
