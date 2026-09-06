-- Group lessons into categories. `position` becomes the order WITHIN a
-- category, so (category, position) renders as "1.2" and sorts the home page.
--
-- Run this once in the Supabase SQL editor (or via the Supabase MCP server),
-- then `npm run seed:supabase` to load the restructured lesson files.

alter table public.lessons
  add column if not exists category integer not null default 1;

-- Order within a category has to be unique, the old global one does not.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'lessons_position_key') then
    alter table public.lessons drop constraint lessons_position_key;
  end if;
end $$;

create index if not exists lessons_category_position_idx
  on public.lessons (category, position);
