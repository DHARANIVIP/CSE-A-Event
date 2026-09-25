import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const content = fs.readFileSync(path.resolve(process.cwd(), "teams-credentials-export.csv"), "utf-8");
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
  const memberStr = `${name} (${regNo})`;
  return `  ('${teamId}', '${teamName.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}', '${regNo}', '${email.replace(/'/g, "''")}', ARRAY['${memberStr.replace(/'/g, "''")}']::text[], '${pinHash}', false)`;
});

const sql = `-- =========================================================================
-- DETECTRIX 2026 - SEED 25 STUDENT TEAMS INTO SUPABASE
-- Run this in your Supabase Dashboard: SQL Editor -> Run
-- =========================================================================

-- 1. Ensure table has all required columns
alter table public.teams add column if not exists leader_name text not null default '';
alter table public.teams add column if not exists leader_reg_no text not null default '';
alter table public.teams add column if not exists leader_email text default '';
alter table public.teams add column if not exists leader_mobile text default '';
alter table public.teams add column if not exists leader_gender text default '';
alter table public.teams add column if not exists leader_section text default '';

-- 2. Fast lookup indexes for Roll No & Email logins
create index if not exists idx_teams_leader_reg_no on public.teams(leader_reg_no);
create index if not exists idx_teams_leader_email on public.teams(leader_email);

-- 3. Insert / update all 25 teams (members as text[])
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

-- 4. Confirm total teams in database
select count(*) as total_teams_seeded from public.teams;
`;

fs.writeFileSync(path.resolve(process.cwd(), "supabase/seed-students.sql"), sql, "utf-8");
console.log("Regenerated supabase/seed-students.sql using text[] for members!");
