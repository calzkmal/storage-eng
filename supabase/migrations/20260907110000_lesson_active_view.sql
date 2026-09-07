-- One row per lesson joined to the set it is using, so the whole syllabus
-- loads in a single query. security_invoker keeps RLS applying to the caller.

create or replace view public.lesson_active
with (security_invoker = true) as
select
  l.id,
  l.category,
  l.position,
  l.title,
  l.intro,
  s.id                             as set_id,
  s.version                        as set_version,
  s.source                         as set_source,
  s.model_used,
  s.exercises,
  jsonb_array_length(s.exercises)  as exercise_count
from public.lessons l
join public.exercise_sets s on s.id = l.active_set_id;

revoke all on public.lesson_active from anon, authenticated;

-- Superseded by the view above.
drop view if exists public.lesson_overview;
