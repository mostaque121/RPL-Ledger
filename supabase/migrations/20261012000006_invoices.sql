-- RPL Ledger — invoices.
-- An invoice has one number (e.g. RFT-4528) and one or more versions. Updating an invoice
-- (say, after the client pays an instalment) adds a new version with the same number; older
-- versions and their PDFs are kept. PDFs live in the private Storage bucket `invoices`.
-- Run once in the Supabase SQL Editor after 0005.

-- ============================================================ invoice_profile (one row)

-- Company and bank details printed on every invoice, plus the numbering. Edited on Settings.
create table public.invoice_profile (
  id                    boolean primary key default true check (id),
  company_name          text not null default '',
  address               text not null default '',
  phone                 text not null default '',
  email                 text not null default '',
  website               text not null default '',
  abn                   text not null default '',
  bank_account_name     text not null default '',
  bank_bsb              text not null default '',
  bank_account_number   text not null default '',
  number_prefix         text not null default 'RFT-' check (length(number_prefix) <= 10),
  first_number          integer not null default 4528 check (first_number > 0),
  payment_terms_days    integer not null default 7 check (payment_terms_days between 0 and 365),
  gst_included          boolean not null default true,
  default_notes         text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- The "Upon payment, customer agrees to … terms and conditions" line is always printed,
-- so default_notes is only for anything extra.
insert into public.invoice_profile (id, company_name) values (true, 'RPL Fast Track');

-- ============================================================ invoices

create table public.invoices (
  id              uuid primary key default gen_random_uuid(),
  invoice_number  text not null check (length(trim(invoice_number)) > 0),
  -- Optional link to a sale. Kept (set null) if the sale is deleted: the invoice was still sent.
  sale_id         uuid references public.sales (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index invoices_number_unique on public.invoices (lower(invoice_number));
create index invoices_sale_idx on public.invoices (sale_id);

-- ============================================================ invoice_versions (immutable)

-- A full snapshot of what was sent, so an old PDF can always be explained.
-- Total and amount due are calculated from items and amount_paid, not stored.
create table public.invoice_versions (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references public.invoices (id) on delete cascade,
  version         integer not null check (version > 0),
  issued_on       date not null,
  due_on          date not null,
  bill_to_name    text not null check (length(trim(bill_to_name)) > 0),
  bill_to_email   text,
  bill_to_phone   text,
  -- [{ "description": text, "quantity": int, "unit_price": number (AUD) }]
  items           jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  amount_paid     numeric(12,2) not null default 0 check (amount_paid >= 0),
  gst_included    boolean not null default true,
  notes           text,
  -- Company and bank details as printed (a copy of invoice_profile, edited for this invoice if needed).
  issuer          jsonb not null,
  -- Path in the `invoices` bucket, e.g. `<invoice id>/RFT-4528_V2.pdf`.
  pdf_path        text not null,
  created_at      timestamptz not null default now(),
  unique (invoice_id, version)
);
create index invoice_versions_invoice_idx on public.invoice_versions (invoice_id);

-- ============================================================ RPC: save an invoice version

-- Creates the invoice on version 1, then adds the version, in one transaction.
-- The PDF is uploaded by the app first, so `p_version.pdf_path` already exists.
create or replace function public.save_invoice_version(
  p_invoice_id uuid,
  p_invoice_number text,
  p_sale_id uuid,
  p_version jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_version integer := (p_version ->> 'version')::integer;
  v_latest  integer;
begin
  if v_version = 1 then
    insert into public.invoices (id, invoice_number, sale_id)
    values (p_invoice_id, trim(p_invoice_number), p_sale_id);
  else
    select max(version) into v_latest from public.invoice_versions where invoice_id = p_invoice_id;
    if v_latest is null then
      raise exception 'That invoice no longer exists';
    end if;
    if v_version <> v_latest + 1 then
      raise exception 'This invoice was updated somewhere else. Close it and open it again.';
    end if;
    update public.invoices set sale_id = p_sale_id where id = p_invoice_id;
  end if;

  insert into public.invoice_versions (
    invoice_id, version, issued_on, due_on, bill_to_name, bill_to_email, bill_to_phone,
    items, amount_paid, gst_included, notes, issuer, pdf_path
  )
  values (
    p_invoice_id, v_version,
    (p_version ->> 'issued_on')::date,
    (p_version ->> 'due_on')::date,
    p_version ->> 'bill_to_name',
    nullif(p_version ->> 'bill_to_email', ''),
    nullif(p_version ->> 'bill_to_phone', ''),
    p_version -> 'items',
    (p_version ->> 'amount_paid')::numeric,
    (p_version ->> 'gst_included')::boolean,
    nullif(p_version ->> 'notes', ''),
    p_version -> 'issuer',
    p_version ->> 'pdf_path'
  );

  return v_version;
end;
$$;

revoke execute on function public.save_invoice_version(uuid, text, uuid, jsonb) from public, anon;
grant execute on function public.save_invoice_version(uuid, text, uuid, jsonb) to authenticated;

-- ============================================================ updated_at + RLS

create trigger invoice_profile_set_updated_at before update on public.invoice_profile
  for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

do $$
declare
  t text;
begin
  foreach t in array array['invoice_profile', 'invoices', 'invoice_versions']
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

-- ============================================================ storage: private `invoices` bucket

-- Private: files are only reachable by a signed-in user (the app downloads them through the API).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy "authenticated users can read invoice pdfs" on storage.objects
  for select to authenticated using (bucket_id = 'invoices');
create policy "authenticated users can upload invoice pdfs" on storage.objects
  for insert to authenticated with check (bucket_id = 'invoices');
-- Update is needed for `upsert`, so a save that failed half-way can be retried.
create policy "authenticated users can replace invoice pdfs" on storage.objects
  for update to authenticated using (bucket_id = 'invoices') with check (bucket_id = 'invoices');
create policy "authenticated users can delete invoice pdfs" on storage.objects
  for delete to authenticated using (bucket_id = 'invoices');
