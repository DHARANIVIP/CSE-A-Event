-- 0002_views_functions.sql
-- Mystery Box Views and Functions

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

-- Atomic, race-safe recording of a submission decision computed by the server.
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

revoke all on function public.record_submission from public, anon, authenticated;
