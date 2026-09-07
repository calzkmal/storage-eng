-- Superseded by lesson_active. Counts exercises server-side instead of shipping them.
-- security_invoker keeps RLS applying to the caller.

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
