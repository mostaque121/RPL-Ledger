-- RPL Ledger — more sale sources: Social Media, Whatsapp Text, Agent. Run once after 0009.

alter table public.sales drop constraint if exists sales_source_check;
alter table public.sales add constraint sales_source_check
  check (source in ('Website', 'Reference', 'Repeat client', 'Social Media', 'Whatsapp Text', 'Agent', 'Other'));
