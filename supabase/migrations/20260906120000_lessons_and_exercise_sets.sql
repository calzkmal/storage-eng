-- Question storage for English Practice.
--
-- lessons        one row per lesson (id matches content/lessons/<id>.json)
-- exercise_sets  every set of questions ever stored for a lesson: the seeded
--                original (source = 'seed', version 1) and each AI-generated
--                set after it. Nothing is deleted; lessons.active_set_id says
--                which set learners currently get.
--
-- Run this once in the Supabase SQL editor (or via the Supabase MCP server),
-- then `npm run seed:supabase` to load the six lesson files.

create extension if not exists pgcrypto;

create table if not exists public.lessons (
  id            text primary key,
  position      integer not null,
  title         text not null,
  intro         text,
  active_set_id uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.exercise_sets (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   text not null references public.lessons (id) on delete cascade,
  version     integer not null,
  source      text not null check (source in ('seed', 'generated')),
  model_used  text,
  exercises   jsonb not null,
  created_at  timestamptz not null default now(),
  unique (lesson_id, version)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lessons_active_set_fk'
  ) then
    alter table public.lessons
      add constraint lessons_active_set_fk
      foreign key (active_set_id) references public.exercise_sets (id) on delete set null;
  end if;
end $$;

create index if not exists exercise_sets_lesson_version_idx
  on public.exercise_sets (lesson_id, version desc);

-- Locked down: only the service-role key (used server-side) can read or write.
alter table public.lessons enable row level security;
alter table public.exercise_sets enable row level security;
