-- Categories. `position` becomes the order WITHIN a category, so the pair renders as "1.2".

alter table public.lessons
  add column if not exists category integer not null default 1;

-- Only (category, position) needs to be unique now.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'lessons_position_key') then
    alter table public.lessons drop constraint lessons_position_key;
  end if;
end $$;

create index if not exists lessons_category_position_idx
  on public.lessons (category, position);
