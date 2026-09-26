import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
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

const sharedXmlPath = path.resolve(process.cwd(), "content/Book1_extracted/xl/sharedStrings.xml");
const sheetXmlPath = path.resolve(process.cwd(), "content/Book1_extracted/xl/worksheets/sheet1.xml");

if (!fs.existsSync(sharedXmlPath) || !fs.existsSync(sheetXmlPath)) {
  console.error("Extracted XML not found!");
  process.exit(1);
}

const sharedXml = fs.readFileSync(sharedXmlPath, "utf-8");
const sheetXml = fs.readFileSync(sheetXmlPath, "utf-8");

// Parse shared strings
const strings = [];
const strMatches = sharedXml.matchAll(/<si>(.*?)<\/si>/gs);
for (const match of strMatches) {
  const tMatch = match[1].match(/<t[^>]*>(.*?)<\/t>/s);
  strings.push(tMatch ? tMatch[1] : "");
}

// Parse sheet rows
const rows = [];
const rowMatches = sheetXml.matchAll(/<row r="(\d+)"[^>]*>(.*?)<\/row>/gs);
for (const rMatch of rowMatches) {
  const rowNum = parseInt(rMatch[1]);
  const rowContent = rMatch[2];
  const cells = {};
  const cMatches = rowContent.matchAll(/<c r="([A-Z]+)\d+"(?: t="([^"]+)")?[^>]*>(?:<v>([^<]+)<\/v>)?<\/c>/g);
  for (const cMatch of cMatches) {
    const col = cMatch[1];
    const type = cMatch[2];
    const val = cMatch[3];
    if (type === "s") {
      cells[col] = strings[parseInt(val)];
    } else {
      cells[col] = val || "";
    }
  }
  rows.push({ rowNum, cells });
}

console.log("Found rows:", rows.length);

const headerRow = rows[0].cells;
console.log("Headers:", headerRow);

const studentRecords = [];
const specialChars = ["#", "@", "!", "$"];

for (let i = 1; i < rows.length; i++) {
  const cells = rows[i].cells;
  const regNo = cells["A"] || "";
  const email = cells["B"] || "";
  const fullName = cells["C"] || "";
  const teamName = cells["D"] || `Squad ${i}`;
  const teamId = `DTX-${String(i).padStart(2, "0")}`;

  // Generate deterministic/memorable password for each student:
  // e.g. DTX# followed by 4 digits from regNo or random
  const suffix = regNo.length >= 4 ? regNo.slice(-4) : String(crypto.randomInt(1000, 9999));
  const char = specialChars[(i - 1) % specialChars.length];
  const password = `DTX${char}${suffix}`;

  const salt = crypto.randomBytes(16).toString("base64url");
  const pinHash = hashPin(password, salt);

  studentRecords.push({
    teamId,
    teamName: teamName.trim(),
    fullName: fullName.trim(),
    regNo: regNo.trim(),
    email: email.trim(),
    password,
    pinHash,
  });
}

console.table(
  studentRecords.map((s) => ({
    "Team ID": s.teamId,
    "Team Name": s.teamName,
    "Student Name": s.fullName,
    "Roll No": s.regNo,
    "Email": s.email,
    "Password": s.password,
  }))
);

// Write to content/student-credentials-distribution.csv and root teams-credentials-export.csv
const csvHeaders = ["Team ID", "Team Name", "Student Name", "Register Number", "Email ID", "Password", "Login URL", "Email Status"];
const csvRows = [
  csvHeaders.join(","),
  ...studentRecords.map((s) =>
    [
      `"${s.teamId}"`,
      `"${s.teamName.replace(/"/g, '""')}"`,
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.regNo}"`,
      `"${s.email}"`,
      `"${s.password}"`,
      `"http://localhost:3000/enter"`,
      `"PENDING"`,
    ].join(",")
  ),
].join("\n");

fs.writeFileSync(path.resolve(process.cwd(), "content/student-credentials-distribution.csv"), csvRows, "utf-8");
fs.writeFileSync(path.resolve(process.cwd(), "teams-credentials-export.csv"), csvRows, "utf-8");

// Also write a clean markdown table of all credentials for the user!
const mdTable = [
  "# DETECTRIX 2026 – Student Access Credentials",
  "",
  "| Team ID | Team Name | Student Name | Register / Roll Number | Email ID | Generated Password | Login URL |",
  "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
  ...studentRecords.map(
    (s) =>
      `| **${s.teamId}** | ${s.teamName} | ${s.fullName} | \`${s.regNo}\` | \`${s.email}\` | **\`${s.password}\`** | [Login](/enter) |`
  ),
].join("\n");

fs.writeFileSync(path.resolve(process.cwd(), "content/student-credentials.md"), mdTable, "utf-8");

console.log("✅ Successfully generated credentials and distribution files!");
