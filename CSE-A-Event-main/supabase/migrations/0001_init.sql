-- 0001_init.sql
-- Mystery Box Database Schema Initialization

create extension if not exists pgcrypto;

create table if not exists public.teams (
  id            text primary key check (id ~ '^[A-Z0-9-]{3,12}$'),
  name          text not null check (char_length(name) between 2 and 40),
  members       text[] not null default '{}',
  pin_hash      text not null,
  disabled      boolean not null default false,
  created_at    timestamptz not null default clock_timestamp()
);

create table if not exists public.event_state (
  id              smallint primary key default 1 check (id = 1),
  start_at        timestamptz,
  end_at          timestamptz,
  force_status    text check (force_status in ('live','ended','paused')),
  case_released   boolean not null default false,
  case_sha256     text,
  updated_at      timestamptz not null default clock_timestamp()
);
insert into public.event_state (id) values (1) on conflict do nothing;

create table if not exists public.hints (
  id           bigint generated always as identity primary key,
  position     int not null,
  title        text not null,
  body         text not null,
  release_at   timestamptz,
  released     boolean not null default false,
  released_at  timestamptz
);

create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  team_id       text not null references public.teams(id),
  created_at    timestamptz not null default clock_timestamp(),
  is_correct    boolean not null,
  attempt_hash  text,               -- only for wrong attempts, truncated HMAC-SHA256
  request_id    text,
  ip_hash       text
);

create unique index if not exists one_correct_per_team on public.submissions(team_id) where is_correct;
create index if not exists submissions_team_time on public.submissions(team_id, created_at desc);
create index if not exists submissions_correct_time on public.submissions(created_at, id) where is_correct;
create unique index if not exists submissions_request on public.submissions(team_id, request_id) where request_id is not null;

create table if not exists public.login_attempts (
  id          bigint generated always as identity primary key,
  scope       text not null,            -- 'ip:hash' or 'team:id' or 'admin:ip-hash'
  created_at  timestamptz not null default clock_timestamp(),
  success     boolean not null
);
create index if not exists login_attempts_scope_time on public.login_attempts(scope, created_at desc);

create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default clock_timestamp(),
  actor       text not null,            -- 'admin' or team_id
  action      text not null,
  detail      jsonb not null default '{}'
);
