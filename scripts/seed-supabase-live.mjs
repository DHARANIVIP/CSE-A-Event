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

const supabaseUrl = process.env.SUPABASE_URL || "https://izxdhaxxlkfbkkrwdlxo.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey || supabaseKey.includes("test_service") || supabaseKey.includes("mock")) {
  console.log("\n⚠️ SUPABASE_SERVICE_ROLE_KEY in .env.local is set to test placeholder.");
  console.log("To connect to live Supabase:");
  console.log("1. Open your Supabase Dashboard -> Project Settings -> API.");
  console.log("2. Copy the 'service_role' secret key.");
  console.log("3. Paste it as SUPABASE_SERVICE_ROLE_KEY=ey... in .env.local.");
  console.log("4. Alternatively, copy and run 'supabase/seed-students.sql' directly in the Supabase SQL Editor!\n");
} else {
  console.log(`Connecting to Supabase at ${supabaseUrl}...`);
  const supabase = createClient(supabaseUrl, supabaseKey);

  const content = fs.readFileSync(path.resolve(process.cwd(), "teams-credentials-export.csv"), "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(1);
  const salt = "TEST_SALT_16_BYTES_ABC";

  const scryptConfig = { N: 32768, r: 8, p: 1, keylen: 32, maxmem: 64 * 1024 * 1024 };
  function hash(pin) {
    const derivedKey = crypto.scryptSync(pin, salt, scryptConfig.keylen, scryptConfig);
    return `${salt}:${derivedKey.toString("base64url")}`;
  }

  const teamsToUpsert = lines.map((l) => {
    const matches = [...l.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    const [teamId, teamName, name, regNo, email, pass] = matches;
    return {
      id: teamId,
      name: teamName,
      leader_name: name,
      leader_reg_no: regNo,
      leader_email: email,
      members: [{ role: "Leader", name: name, reg_no: regNo }],
      pin_hash: hash(pass),
      disabled: false,
    };
  });

  supabase
    .from("teams")
    .upsert(teamsToUpsert)
    .then(({ data, error }) => {
      if (error) {
        console.error("❌ Supabase Upsert Error:", error.message);
      } else {
        console.log(`🎉 Successfully seeded ${teamsToUpsert.length} student teams directly into live Supabase!`);
      }
    });
}
