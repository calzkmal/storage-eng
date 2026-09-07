-- The home page needs one row per lesson with the number of exercises, not the
-- exercises themselves. Reading the full jsonb for every lesson just to count
-- it moved ~50KB per page load; this view counts server-side instead.
--
-- security_invoker keeps row level security applying to the caller, so the
-- view is not a way around it. Only the service role reads it.

create or replace view public.lesson_overview
with (security_invoker = true) as
select
  l.id,
  l.category,
  l.position,
  l.title,
  l.intro,
  l.active_set_id,
  s.version                        as set_version,
  s.source                         as set_source,
  s.model_used,
  jsonb_array_length(s.exercises)  as exercise_count
from public.lessons l
left join public.exercise_sets s on s.id = l.active_set_id;

revoke all on public.lesson_overview from anon, authenticated;
