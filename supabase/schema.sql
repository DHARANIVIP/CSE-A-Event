-- =========================================================================
-- DETECTRIX / MYSTERY BOX - COMPLETE SUPABASE DATABASE SCHEMA
-- Project ID: izxdhaxxlkfbkkrwdlxo
-- Paste this entire script into your Supabase Dashboard: SQL Editor -> Run
-- =========================================================================

-- 1. Enable Cryptographic Extensions
create extension if not exists pgcrypto;

-- 2. TEAMS TABLE (Stores team credentials, leader details, members, and scrypt password hashes)
create table if not exists public.teams (
  id              text primary key check (id ~ '^[A-Z0-9-]{3,25}$'), -- e.g. DTX-01, TEAM-01
  name            text not null check (char_length(name) between 2 and 60), -- Team Name
  leader_name     text not null default '',
  leader_reg_no   text not null default '',
  leader_email    text default '',
  leader_mobile   text default '',
  leader_gender   text default '',
  leader_section  text default '',
  members         jsonb not null default '[]', -- Array of [{ name: "...", reg_no: "..." }]
  pin_hash        text not null, -- scrypt hash of the team password (format salt:hash)
  disabled        boolean not null default false,
  created_at      timestamptz not null default clock_timestamp()
);

-- Fast lookup indexes: allows sign in with either Team ID OR Leader Register Number
create index if not exists idx_teams_leader_reg_no on public.teams(leader_reg_no);
create index if not exists idx_teams_disabled on public.teams(disabled);

-- 3. EVENT STATE TABLE (Single row singleton controlling competition status)
create table if not exists public.event_state (
  id              smallint primary key default 1 check (id = 1),
  start_at        timestamptz,
  end_at          timestamptz,
  force_status    text check (force_status in ('live','ended','paused')),
  case_released   boolean not null default false,
  case_sha256     text,
  updated_at      timestamptz not null default clock_timestamp()
);

-- Seed default initial event state (Case open, status live)
insert into public.event_state (id, force_status, case_released)
values (1, 'live', true)
on conflict (id) do update set
  force_status = excluded.force_status,
  case_released = excluded.case_released;

-- 4. HINTS TABLE (Time-released or admin-released progressive hints)
create table if not exists public.hints (
  id           bigint generated always as identity primary key,
  position     int not null,
  title        text not null,
  body         text not null,
  release_at   timestamptz,
  released     boolean not null default false,
  released_at  timestamptz
);

-- 5. SUBMISSIONS TABLE (Tamper-proof record of every code submission)
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  team_id       text not null references public.teams(id) on delete cascade,
  created_at    timestamptz not null default clock_timestamp(),
  is_correct    boolean not null,
  attempt_hash  text,               -- Truncated HMAC-SHA256 for wrong attempts
  request_id    text,
  ip_hash       text
);

-- Strict integrity indexes
create unique index if not exists one_correct_per_team on public.submissions(team_id) where is_correct;
create index if not exists submissions_team_time on public.submissions(team_id, created_at desc);
create index if not exists submissions_correct_time on public.submissions(created_at, id) where is_correct;
create unique index if not exists submissions_request on public.submissions(team_id, request_id) where request_id is not null;

-- 6. LOGIN ATTEMPTS TABLE (Auditing and brute-force defense)
create table if not exists public.login_attempts (
  id          bigint generated always as identity primary key,
  scope       text not null,            -- 'ip:hash' or 'team:id'
  created_at  timestamptz not null default clock_timestamp(),
  success     boolean not null
);
create index if not exists login_attempts_scope_time on public.login_attempts(scope, created_at desc);

-- 7. AUDIT LOG TABLE (Admin operations, hint releases, disqualifications)
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default clock_timestamp(),
  actor       text not null,
  action      text not null,
  detail      jsonb not null default '{}'
);

-- 8. LEADERBOARD VIEW (Live server-ranked standings with tie-breaking)
create or replace view public.leaderboard as
select
  t.id as team_id,
  t.name as team_name,
  s.created_at as solved_at,
  case when s.id is not null then row_number() over (order by s.created_at, s.id) end as rank,
  (select count(*) from public.submissions x where x.team_id = t.id) as attempts
from public.teams t
left join public.submissions s on s.team_id = t.id and s.is_correct
where not t.disabled;

-- 9. ATOMIC RACE-CONDITION SAFE SUBMISSION PROCEDURE
create or replace function public.record_submission(
  p_team_id text,
  p_is_correct boolean,
  p_attempt_hash text,
  p_request_id text,
  p_ip_hash text
) returns table (created_at timestamptz, rank bigint) language plpgsql security definer as $$
declare
  v_row public.submissions;
  v_rank bigint;
begin
  -- Advisory transaction lock guarantees atomic sequence serialization across concurrent workers
  perform pg_advisory_xact_lock(hashtext('record_submission'));

  insert into public.submissions(team_id, is_correct, attempt_hash, request_id, ip_hash)
  values (p_team_id, p_is_correct, case when p_is_correct then null else p_attempt_hash end, p_request_id, p_ip_hash)
  on conflict do nothing
  returning * into v_row;

  if v_row.id is null then  -- duplicate request or already solved
    select * into v_row from public.submissions
      where team_id = p_team_id and ((p_request_id is not null and request_id = p_request_id) or is_correct)
      order by created_at limit 1;
  end if;

  if v_row.is_correct then
    select count(*) into v_rank from public.submissions where is_correct and (created_at, id) <= (v_row.created_at, v_row.id);
  end if;

  return query select v_row.created_at, v_rank;
end $$;

-- 10. ROW LEVEL SECURITY (Zero Client-Side Leakage)
alter table public.teams enable row level security;
alter table public.event_state enable row level security;
alter table public.hints enable row level security;
alter table public.submissions enable row level security;
alter table public.login_attempts enable row level security;
alter table public.audit_log enable row level security;

-- Revoke direct anon/authenticated access (All traffic routes through Next.js server-side service-role)
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on function public.record_submission from public, anon, authenticated;

-- Confirmation
select 'Detectrix database schema successfully initialized for project izxdhaxxlkfbkkrwdlxo' as status;
