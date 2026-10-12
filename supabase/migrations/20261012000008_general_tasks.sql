-- RPL Ledger — tasks no longer need a sale ("general" tasks, e.g. "Pay the HubSpot bill").
-- Tasks linked to a sale still go with it when it is deleted. Run once after 0007.

alter table public.sale_tasks
  alter column sale_id drop not null;

comment on column public.sale_tasks.sale_id is
  'The sale this task is for. Null = a general task, not about any one sale.';
