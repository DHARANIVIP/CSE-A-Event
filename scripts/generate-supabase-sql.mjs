import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const content = fs.readFileSync(path.resolve(process.cwd(), "content/student-credentials-distribution.csv"), "utf-8");
const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(1);
const salt = "TEST_SALT_16_BYTES_ABC";

const scryptConfig = { N: 32768, r: 8, p: 1, keylen: 32, maxmem: 64 * 1024 * 1024 };
function hash(pin) {
  const derivedKey = crypto.scryptSync(pin, salt, scryptConfig.keylen, scryptConfig);
  return `${salt}:${derivedKey.toString("base64url")}`;
}

const values = lines.map((l) => {
  const matches = [...l.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  const [teamId, teamName, name, regNo, email, pass] = matches;
  const pinHash = hash(pass);
  const membersJson = JSON.stringify([{ role: "Leader", name: name, reg_no: regNo }]);
  return `  ('${teamId}', '${teamName.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}', '${regNo}', '${email.replace(/'/g, "''")}', '${membersJson.replace(/'/g, "''")}'::jsonb, '${pinHash}', false)`;
});

const sql = `-- =========================================================================
-- DETECTRIX 2026 - SEED 25 STUDENT TEAMS INTO SUPABASE
-- Run this in your Supabase Dashboard: SQL Editor -> Run
-- =========================================================================

-- Ensure index on email and reg_no for instant login queries
create index if not exists idx_teams_leader_reg_no on public.teams(leader_reg_no);
create index if not exists idx_teams_leader_email on public.teams(leader_email);

insert into public.teams (
  id,
  name,
  leader_name,
  leader_reg_no,
  leader_email,
  members,
  pin_hash,
  disabled
) values
${values.join(",\n")}
on conflict (id) do update set
  name = excluded.name,
  leader_name = excluded.leader_name,
  leader_reg_no = excluded.leader_reg_no,
  leader_email = excluded.leader_email,
  members = excluded.members,
  pin_hash = excluded.pin_hash,
  disabled = excluded.disabled;

-- Confirmation
select count(*) as seeded_teams_count from public.teams;
`;

fs.writeFileSync(path.resolve(process.cwd(), "supabase/seed-students.sql"), sql, "utf-8");
console.log("Generated supabase/seed-students.sql with 25 student teams!");
