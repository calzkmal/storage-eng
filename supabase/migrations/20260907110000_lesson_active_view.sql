-- One row per lesson, already joined to the exercise set it is using.
--
-- Opening a lesson used to cost two sequential round trips (the lesson row,
-- then its active set) and each lesson was cached separately, so every lesson
-- opened for the first time paid both. Latency dominates these queries: reading
-- all 18 sets with their exercises measured the same as reading one, so the app
-- now loads the whole syllabus in a single query and caches it once.
--
-- security_invoker keeps row level security applying to the caller, so the view
-- is not a way around it. Only the service role reads it.

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

-- Superseded by the view above, which carries the same columns plus exercises.
drop view if exists public.lesson_overview;
