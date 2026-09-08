-- Shared fixed-window rate limit. Held in Postgres so it counts across
-- serverless isolates; the in-process fallback in lib/rateLimit.ts only covers
-- a brief outage, and refuses outright when this function is missing.

create table if not exists public.rate_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

-- Service-role only. RLS on with no policies denies anon and authenticated.
alter table public.rate_limits enable row level security;

create index if not exists rate_limits_window_start_idx on public.rate_limits (window_start);

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_sec integer)
language plpgsql
-- Empty search_path: an unqualified name can never resolve to another schema.
set search_path = ''
as $function$
declare
  v_start timestamptz;
  v_count integer;
  v_window interval := make_interval(secs => p_window_seconds);
begin
  -- One atomic statement, so concurrent callers cannot both read a stale count.
  insert into public.rate_limits as r (bucket, window_start, count)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update
    set count = case when r.window_start < now() - v_window then 1 else r.count + 1 end,
        window_start = case when r.window_start < now() - v_window then now() else r.window_start end
  returning r.window_start, r.count into v_start, v_count;

  -- Opportunistic cleanup, so abandoned buckets do not accumulate.
  if random() < 0.005 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  allowed := v_count <= p_limit;
  retry_after_sec := greatest(1, ceil(extract(epoch from (v_start + v_window - now())))::integer);
  return next;
end;
$function$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- Ceiling on stored answers per learner, trimmed oldest first. Sampled rather
-- than run on every insert, which would make the count the cost of the write.
create or replace function public.cap_attempts_per_learner()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_count integer;
begin
  if random() > 0.02 then
    return null;
  end if;

  select count(*) into v_count from public.attempts where learner_id = new.learner_id;
  if v_count > 2000 then
    delete from public.attempts
    where id in (
      select id from public.attempts
      where learner_id = new.learner_id
      order by created_at desc
      offset 2000
    );
  end if;
  return null;
end;
$function$;

drop trigger if exists attempts_cap_per_learner on public.attempts;
create trigger attempts_cap_per_learner
  after insert on public.attempts
  for each row execute function public.cap_attempts_per_learner();
