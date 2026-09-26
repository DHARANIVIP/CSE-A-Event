-- 0003_rls.sql
-- Enable Row Level Security and revoke all public/anon/authenticated access.
-- All database operations execute exclusively through Route Handlers using the service-role key.

alter table public.teams enable row level security;
alter table public.event_state enable row level security;
alter table public.hints enable row level security;
alter table public.submissions enable row level security;
alter table public.login_attempts enable row level security;
alter table public.audit_log enable row level security;

-- Revoke all table permissions from public, anon, and authenticated roles
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
