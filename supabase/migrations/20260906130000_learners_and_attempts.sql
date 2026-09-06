-- Accountless progress tracking.
--
-- learners  one row per anonymous profile. `id` is a random UUID minted in the
--           browser and kept in localStorage; the name the learner types is
--           only a label on it. Two people who type the same name are two
--           different learners, and the same person on a second device is a
--           new learner, because the UUID is what identifies them.
-- attempts  one row per checked answer, so the history screen can replay the
--           exact questions and answers. `run_id` groups the answers of one
--           pass through a lesson.
--
-- Run this once in the Supabase SQL editor (or via the Supabase MCP server).

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
  -- One pass through a lesson. Minted per lesson run in the browser.
  run_id         uuid not null,
  lesson_id      text not null,
  lesson_title   text not null,
  -- exercise_sets.id, or file:<lessonId> when running from the bundled JSON.
  set_id         text,
  exercise_id    text not null,
  exercise_type  text not null,
  -- 'main' for the first pass, 'review' for the recycled wrong answers.
  phase          text not null check (phase in ('main', 'review')),
  question       text not null,
  user_answer    text not null,
  correct_answer text not null,
  -- null means the answer could not be checked (AI unavailable on a free write).
  correct        boolean,
  graded_by      text not null check (graded_by in ('local', 'ai', 'cache', 'fallback')),
  created_at     timestamptz not null default now()
);

create index if not exists attempts_learner_created_idx on public.attempts (learner_id, created_at desc);
create index if not exists attempts_run_idx on public.attempts (run_id);

-- Locked down: only the service-role key (used server-side) can read or write.
alter table public.learners enable row level security;
alter table public.attempts enable row level security;
