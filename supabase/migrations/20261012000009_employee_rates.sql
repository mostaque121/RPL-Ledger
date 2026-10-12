-- RPL Ledger — employee pay history. Salary and per-sale commission change over time, so each
-- change is a row with the date it takes effect. Past months, late commissions and back-dated
-- salaries then use the rate of their own date, not today's.
--
-- Moves each employee's current salary / commission into the history (effective from the day they
-- were added; the earliest rate also covers anything before it), rewrites add_monthly_salaries to
-- use the history, then drops the two old columns from people. Run once after 0008.

-- ============================================================ employee_rates

create table public.employee_rates (
  id                       uuid primary key default gen_random_uuid(),
  person_id                uuid not null references public.people (id) on delete cascade,
  effective_from           date not null,
  salary_bdt               numeric(12,2) check (salary_bdt >= 0),
  commission_per_sale_bdt  numeric(12,2) check (commission_per_sale_bdt >= 0),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint employee_rates_one_per_day unique (person_id, effective_from)
);

comment on table public.employee_rates is
  'Pay history: the rate in force on a date is the latest row starting on or before it; the earliest row also covers earlier dates.';

create trigger employee_rates_set_updated_at
  before update on public.employee_rates
  for each row execute function public.set_updated_at();

-- Only employees have pay (partners take profit, not salary).
create or replace function public.employee_rates_employee_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.people p where p.id = new.person_id and p.role = 'employee') then
    raise exception 'Pay rates are for employees only';
  end if;
  return new;
end;
$$;

create trigger employee_rates_employee_only
  before insert or update on public.employee_rates
  for each row execute function public.employee_rates_employee_only();

alter table public.employee_rates enable row level security;
create policy "authenticated users can do everything" on public.employee_rates
  for all to authenticated using (true) with check (true);
revoke all on public.employee_rates from anon;

-- ============================================================ move the current values

insert into public.employee_rates (person_id, effective_from, salary_bdt, commission_per_sale_bdt)
select p.id, p.created_at::date, p.salary_bdt, p.commission_per_sale_bdt
from public.people p
where p.role = 'employee'
  and (p.salary_bdt is not null or p.commission_per_sale_bdt is not null);

-- ============================================================ rate on a date

-- The rate in force on p_on: the latest row starting on or before it, otherwise the earliest row.
-- Mirrors `rateOn` in src/features/employees/rates.ts. No rows → a row of nulls.
create or replace function public.employee_rate_on(p_person_id uuid, p_on date)
returns public.employee_rates
language sql
stable
security invoker
set search_path = ''
as $$
  select r.*
  from public.employee_rates r
  where r.person_id = p_person_id
  order by (r.effective_from <= p_on) desc,
           case when r.effective_from <= p_on then r.effective_from end desc nulls last,
           r.effective_from asc
  limit 1;
$$;

revoke execute on function public.employee_rate_on(uuid, date) from public, anon;
grant execute on function public.employee_rate_on(uuid, date) to authenticated;

-- ============================================================ RPC: add monthly salaries

-- Same as before, but each salary is the one in force on the pay date.
create or replace function public.add_monthly_salaries(p_spent_on date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', p_spent_on)::date;
  v_rate  numeric;
  v_count integer;
begin
  select aud_to_bdt into v_rate from public.fx_rates where month = v_month;
  if v_rate is null then
    raise exception 'No AUD→BDT rate set for %', to_char(v_month, 'Mon YYYY');
  end if;

  insert into public.expenses (spent_on, category, description, original_amount, currency, fx_rate, employee_id, split)
  select p_spent_on, 'Salary', 'Salary ' || to_char(v_month, 'Mon YYYY') || ' — ' || p.name,
         r.salary_bdt, 'BDT', v_rate, p.id, 'shared'
  from public.people p
  cross join lateral public.employee_rate_on(p.id, p_spent_on) r
  where p.role = 'employee'
    and p.active
    and coalesce(r.salary_bdt, 0) > 0
    and not exists (
      select 1 from public.expenses e
      where e.employee_id = p.id
        and e.category = 'Salary'
        and e.spent_on >= v_month
        and e.spent_on < (v_month + interval '1 month')
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ============================================================ drop the old columns

alter table public.people
  drop column salary_bdt,
  drop column commission_per_sale_bdt;
