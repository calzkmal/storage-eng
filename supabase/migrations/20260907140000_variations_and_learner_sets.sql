-- Pre-built question variations replace on-demand AI regeneration.
-- Each lesson keeps its seed set (version 1) plus 15 variations (versions 2+),
-- and learner_sets flags which sets each learner has completed.

alter table public.exercise_sets drop constraint if exists exercise_sets_source_check;
alter table public.exercise_sets
  add constraint exercise_sets_source_check
  check (source in ('seed', 'generated', 'variation'));

create table if not exists public.learner_sets (
  learner_id   uuid not null references public.learners (id) on delete cascade,
  set_id       uuid not null references public.exercise_sets (id) on delete cascade,
  lesson_id    text not null,
  completed_at timestamptz not null default now(),
  primary key (learner_id, set_id)
);

create index if not exists learner_sets_learner_lesson_idx
  on public.learner_sets (learner_id, lesson_id);

-- Service-role only.
alter table public.learner_sets enable row level security;

-- Every playable set for a lesson, seed first then the variations in order.
create or replace view public.lesson_sets
with (security_invoker = true) as
select
  s.id            as set_id,
  s.lesson_id,
  s.version,
  s.source,
  s.exercises,
  l.category,
  l.position,
  l.title,
  l.intro
from public.exercise_sets s
join public.lessons l on l.id = s.lesson_id
where s.source in ('seed', 'variation');

revoke all on public.lesson_sets from anon, authenticated;
