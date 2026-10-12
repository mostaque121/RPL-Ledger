-- RPL Ledger — courses as a managed list (like RTOs), so sales pick from it and reports can
-- group profit by course. Replaces the free-text sales.course column with sales.course_id.
-- Run once in the Supabase SQL Editor after 0001 and 0002. Safe if sales already has rows:
-- existing course names are copied into the list first.

create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index courses_name_unique on public.courses (lower(name));

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

alter table public.courses enable row level security;
create policy "authenticated users can do everything" on public.courses
  for all to authenticated using (true) with check (true);
revoke all on public.courses from anon;

-- ------------------------------------------------------------ sales.course → sales.course_id

alter table public.sales
  add column course_id uuid references public.courses (id) on delete restrict;
create index sales_course_idx on public.sales (course_id);

insert into public.courses (name)
select distinct on (lower(trim(course))) trim(course)
from public.sales
where course is not null and length(trim(course)) > 0
order by lower(trim(course)), trim(course)
on conflict do nothing;

update public.sales s
set course_id = c.id
from public.courses c
where s.course is not null and lower(trim(s.course)) = lower(c.name);

alter table public.sales drop column course;
