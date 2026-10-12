-- RPL Ledger — initial schema.
-- Money: numeric(12,2) in AUD. Values the app can calculate (due, status, profit, tax, ...) are NOT stored.
-- Run once in the Supabase SQL Editor, or with `supabase db push`.

-- ============================================================ helpers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================ people

create table public.people (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null check (length(trim(name)) > 0),
  role                     text not null check (role in ('partner', 'employee')),
  partner_key              text unique check (partner_key in ('tanvir', 'md')),
  salary_bdt               numeric(12,2) check (salary_bdt >= 0),
  commission_per_sale_bdt  numeric(12,2) check (commission_per_sale_bdt >= 0),
  active                   boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  -- partners are identified by partner_key, never by name
  constraint people_partner_key_matches_role check ((role = 'partner') = (partner_key is not null))
);
create unique index people_name_unique on public.people (lower(name));

comment on column public.people.partner_key is 'tanvir | md. Used by the accounting rules to know whose sale it is.';

-- Partners can never be deleted (their sales and statements depend on them).
create or replace function public.prevent_partner_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'partner' then
    raise exception 'Partners cannot be deleted';
  end if;
  return old;
end;
$$;

create trigger people_prevent_partner_delete
  before delete on public.people
  for each row execute function public.prevent_partner_delete();

-- ============================================================ rtos

create table public.rtos (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index rtos_name_unique on public.rtos (lower(name));

-- ============================================================ sales

create table public.sales (
  id                   uuid primary key default gen_random_uuid(),
  sale_date            date not null,
  seller_id            uuid not null references public.people (id) on delete restrict,
  client_name          text not null check (length(trim(client_name)) > 0),
  phone                text,
  email                text,
  course               text,
  rto_id               uuid references public.rtos (id) on delete restrict,
  course_fee           numeric(12,2) not null check (course_fee >= 0),
  rto_cost             numeric(12,2) not null default 0 check (rto_cost >= 0),
  referral_commission  numeric(12,2) not null default 0 check (referral_commission >= 0),
  source               text not null default 'Website'
                         check (source in ('Website', 'Reference', 'Repeat client', 'Other')),
  docs_link            text,
  notes                text,
  completed_on         date,
  cancelled            boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint sales_not_completed_and_cancelled check (not (cancelled and completed_on is not null))
);
create index sales_sale_date_idx    on public.sales (sale_date);
create index sales_completed_on_idx on public.sales (completed_on);
create index sales_seller_idx       on public.sales (seller_id);
create index sales_rto_idx          on public.sales (rto_id);

comment on column public.sales.completed_on is
  'Set by the "Completed" toggle. Profit, tax and the partner split count in this month.';

-- ============================================================ payments (client → company)

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references public.sales (id) on delete cascade,
  paid_on     date not null,
  amount      numeric(12,2) not null check (amount <> 0),  -- negative = refund
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index payments_sale_idx    on public.payments (sale_id);
create index payments_paid_on_idx on public.payments (paid_on);

-- ============================================================ rto_payments (company → RTO)

create table public.rto_payments (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references public.sales (id) on delete cascade,
  paid_on     date not null,
  amount      numeric(12,2) not null check (amount <> 0),  -- negative = RTO refund
  agency      text,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index rto_payments_sale_idx    on public.rto_payments (sale_id);
create index rto_payments_paid_on_idx on public.rto_payments (paid_on);

-- ============================================================ fx_rates

create table public.fx_rates (
  id          uuid primary key default gen_random_uuid(),
  month       date not null unique check (extract(day from month) = 1),
  aud_to_bdt  numeric(10,4) not null check (aud_to_bdt > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================ expenses

create table public.expenses (
  id               uuid primary key default gen_random_uuid(),
  spent_on         date not null,
  category         text not null check (category in
                     ('Ads', 'Software', 'Phone', 'Salary', 'Employee commission', 'Lead cost', 'Other')),
  description      text,
  original_amount  numeric(12,2) not null check (original_amount > 0),
  currency         text not null default 'AUD' check (currency in ('AUD', 'BDT')),
  fx_rate          numeric(10,4),
  -- Always derived from original_amount, so it can never drift.
  amount_aud       numeric(12,2) generated always as (
                     case when currency = 'BDT' then round(original_amount / fx_rate, 2)
                          else original_amount end
                   ) stored,
  employee_id      uuid references public.people (id) on delete restrict,
  split            text not null default 'shared' check (split in ('shared', 'tanvir', 'md')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint expenses_fx_matches_currency check (
    (currency = 'AUD' and fx_rate is null) or (currency = 'BDT' and fx_rate > 0)
  )
);
create index expenses_spent_on_idx on public.expenses (spent_on);
create index expenses_employee_idx on public.expenses (employee_id);
create index expenses_category_idx on public.expenses (category);

comment on column public.expenses.amount_aud is 'Generated: original_amount (AUD) or original_amount / fx_rate (BDT).';

-- ============================================================ settings

create table public.settings (
  key         text primary key check (key in ('tax_pct', 'tanvir_share', 'md_share')),
  value       numeric(6,2) not null check (value >= 0 and value <= 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Default settings, inserted BEFORE the share-check trigger below exists. A deferred trigger
-- leaves "pending events" until commit, and Postgres then refuses any later ALTER TABLE on
-- settings in the same transaction (the SQL Editor runs the whole file as one transaction).
insert into public.settings (key, value) values
  ('tax_pct', 20),
  ('tanvir_share', 60),
  ('md_share', 40);

-- tanvir_share + md_share must be 100. Checked at commit, so both rows can be
-- updated in one upsert or transaction.
create or replace function public.check_partner_shares()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  total numeric;
begin
  select coalesce(sum(value), 0) into total
  from public.settings
  where key in ('tanvir_share', 'md_share');
  if total <> 100 then
    raise exception 'tanvir_share + md_share must equal 100 (got %)', total;
  end if;
  return null;
end;
$$;

create constraint trigger settings_partner_shares_total
  after insert or update or delete on public.settings
  deferrable initially deferred
  for each row execute function public.check_partner_shares();

-- ============================================================ updated_at triggers

do $$
declare
  t text;
begin
  foreach t in array array['people', 'rtos', 'sales', 'payments', 'rto_payments', 'fx_rates', 'expenses', 'settings']
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;

-- ============================================================ RPC: add monthly salaries

-- Creates one Salary expense (BDT, at that month's FX rate) for every active employee
-- with a salary who doesn't already have one that month. Safe to click twice.
-- Returns the number of expenses created.
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
         p.salary_bdt, 'BDT', v_rate, p.id, 'shared'
  from public.people p
  where p.role = 'employee'
    and p.active
    and coalesce(p.salary_bdt, 0) > 0
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

-- ============================================================ row level security
-- Single-user app: public sign-ups are disabled in the dashboard, so any authenticated
-- user is the owner. Anonymous users get nothing.

do $$
declare
  t text;
begin
  foreach t in array array['people', 'rtos', 'sales', 'payments', 'rto_payments', 'fx_rates', 'expenses', 'settings']
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

revoke execute on function public.add_monthly_salaries(date) from public, anon;
grant execute on function public.add_monthly_salaries(date) to authenticated;
