-- Additive multi-subject metadata. Existing IDs, sets, and RLS stay intact.
alter table public.lessons
  add column subject text not null default 'english' check (subject in ('english', 'matematika', 'bahasa-indonesia')),
  add column level jsonb,
  add column objectives jsonb,
  add column material jsonb,
  add column stimuli jsonb;
create index lessons_subject_category_position_idx on public.lessons (subject, category, position);
alter table public.attempts
  add column subject text not null default 'english' check (subject in ('english', 'matematika', 'bahasa-indonesia')),
  add column competency text,
  add column context jsonb check (context is null or octet_length(context::text) <= 16384);
create index attempts_learner_subject_created_idx on public.attempts (learner_id, subject, created_at desc);
-- Append columns: CREATE OR REPLACE preserves existing view column positions.
create or replace view public.lesson_sets with (security_invoker = true) as
select s.id as set_id, s.lesson_id, s.version, s.source, s.exercises,
  l.category, l.position, l.title, l.intro,
  l.subject, l.level, l.objectives, l.material, l.stimuli
from public.exercise_sets s join public.lessons l on l.id = s.lesson_id
where s.source in ('seed', 'variation');
create or replace view public.lesson_active with (security_invoker = true) as
select l.id, l.category, l.position, l.title, l.intro,
  s.id as set_id, s.version as set_version, s.source as set_source,
  s.model_used, s.exercises, jsonb_array_length(s.exercises) as exercise_count,
  l.subject, l.level, l.objectives, l.material, l.stimuli
from public.lessons l join public.exercise_sets s on s.id = l.active_set_id;
-- lesson_overview was dropped by 20260907110000; no callers remain.
revoke all on public.lesson_sets, public.lesson_active from anon, authenticated;
