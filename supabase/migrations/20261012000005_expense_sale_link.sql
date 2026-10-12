-- RPL Ledger — link an employee-commission expense to the sale it was paid for.
-- Lets the sale drawer show "commission added", stops it being added twice, and lets the
-- Employees page compare commission paid vs owed. Run once in the Supabase SQL Editor after 0004.

alter table public.expenses
  add column sale_id uuid references public.sales (id) on delete set null;

create index expenses_sale_idx on public.expenses (sale_id);

-- One commission expense per sale.
create unique index expenses_sale_commission_unique
  on public.expenses (sale_id)
  where category = 'Employee commission';

comment on column public.expenses.sale_id is
  'The sale an Employee commission expense belongs to. Kept (set null) if the sale is deleted.';
