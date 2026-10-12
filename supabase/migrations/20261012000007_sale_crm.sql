-- RPL Ledger — CRM on a sale: notes (can be pinned) and follow-up tasks.
-- Neither affects any accounting figure. Both go with the sale when it is deleted.
-- Run once in the Supabase SQL Editor after 0006.

-- ============================================================ notes

create table public.sale_notes (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales (id) on delete cascade,
  body       text not null check (length(btrim(body)) between 1 and 4000),
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sale_notes_sale_idx on public.sale_notes (sale_id, pinned desc, created_at desc);

-- ============================================================ tasks

create table public.sale_tasks (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales (id) on delete cascade,
  title      text not null check (length(btrim(title)) between 1 and 200),
  -- Optional: a task without a date is "whenever".
  due_on     date,
  -- Null while open. Set when ticked off.
  done_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sale_tasks_sale_idx on public.sale_tasks (sale_id);
create index sale_tasks_open_idx on public.sale_tasks (due_on) where done_at is null;

-- ============================================================ updated_at + RLS

create trigger sale_notes_set_updated_at before update on public.sale_notes
  for each row execute function public.set_updated_at();
create trigger sale_tasks_set_updated_at before update on public.sale_tasks
  for each row execute function public.set_updated_at();

do $$
declare
  t text;
begin
  foreach t in array array['sale_notes', 'sale_tasks']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "authenticated users can do everything" on public.%I
         for all to authenticated using (true) with check (true)', t
    );
    execute format('revoke all on public.%I from anon', t);
  end loop;
end;
$$;
