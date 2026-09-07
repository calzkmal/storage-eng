-- Accountless progress. learners.id is a UUID minted in the browser; the name
-- is only a label on it. attempts holds one row per checked answer.

create extension if not exists pgcrypto;

create table if not exists public.learners (
  id           uuid primary key,
  name         text not null,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id             uuid primary key default gen_random_uuid(),
  learner_id     uuid not null references public.learners (id) on delete cascade,
  -- One pass through a lesson.
  run_id         uuid not null,
  lesson_id      text not null,
  lesson_title   text not null,
  -- exercise_sets.id, or file:<lessonId> without a database.
  set_id         text,
  exercise_id    text not null,
  exercise_type  text not null,
  -- 'main' first pass, 'review' for recycled wrong answers.
  phase          text not null check (phase in ('main', 'review')),
  question       text not null,
  user_answer    text not null,
  correct_answer text not null,
  -- null when the answer could not be checked.
  correct        boolean,
  graded_by      text not null check (graded_by in ('local', 'ai', 'cache', 'fallback')),
  created_at     timestamptz not null default now()
);

create index if not exists attempts_learner_created_idx on public.attempts (learner_id, created_at desc);
create index if not exists attempts_run_idx on public.attempts (run_id);

-- Service-role only.
alter table public.learners enable row level security;
alter table public.attempts enable row level security;
