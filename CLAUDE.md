# RPL Ledger — CLAUDE.md

Private accounting web app for an Australian RPL (Recognition of Prior Learning) certificate agency.
It replaces a messy Excel workbook. **Only one user: Tanvir (owner).** He tracks income, expenses,
company profit, his own profit, MD's profit, and employee sales.

Keep it simple. This is an MVP for one person. No multi-tenant, no roles, no over-engineering.

## Tech stack (do not change without asking)

- React + Vite + TypeScript (strict)
- Tailwind CSS + shadcn/ui (clean, professional, finance-dashboard look; light + dark)
- React Router, TanStack Query (data fetching), TanStack Table (data grids)
- React Hook Form + Zod (all forms validated)
- Recharts (charts), date-fns (dates), SheetJS `xlsx` (Excel export)
- `@react-pdf/renderer` (invoice PDFs, rendered in the browser, loaded on demand)
- `cmdk` (the Ctrl / ⌘ + K command box in the top bar)
- `@dnd-kit` (drag to reorder, e.g. a list's columns and filters; those view choices live in localStorage)
- Supabase (Postgres + Auth) via `@supabase/supabase-js` — **no custom backend**
- Vitest for unit tests of the accounting logic
- Deploy: Cloudflare Pages (static build)

## Business model (how money flows)

- The company sells RPL certificates to clients. Each certificate is issued by an **RTO** (ACMC, ATR, Bard, VETA, SCBM, EWC, ...).
- Client pays a **course fee**, in full or in instalments (any number of payments).
- Company pays the RTO its **RTO cost**, usually through an **agency** (codes like OS, OC, NC).
- Sometimes a **referral commission** is paid to an outside referrer.
- **Partners:** Tanvir (60%) and MD (40%).
- **Employees** (Reaz, Mehedi, Oreviya, Rawnak, ...) sell too. They get a monthly salary in BDT plus a per-sale commission in BDT. Both are recorded as **expenses**.
- Shared costs (Meta/Google ads, HubSpot, Jet phone, lead costs, salaries, employee commissions, company formation) are **expenses**.

## Accounting rules (source of truth — implement exactly)

All amounts are stored in **AUD**. BDT is display-only (or the original amount of a BDT expense).

Settings (editable on the Settings page, never hard-coded in the UI): `tax_pct = 20`, `tanvir_share = 60`, `md_share = 40`, plus an AUD→BDT rate for each month.

### Per sale

```
collected     = sum(payments for the sale)
due           = course_fee − collected
status        = due <= 0 ? 'Paid' : collected > 0 ? 'Partial' : 'Unpaid'
profit        = course_fee − rto_cost − referral_commission
tax           = profit × tax_pct            (20% combined GST + income-tax reserve)
net_profit    = profit − tax
rto_paid      = sum(rto_payments for the sale)
rto_due       = rto_cost − rto_paid
hold          = max(0, min(collected, rto_cost) − rto_paid)
                -- client money received that still belongs to the RTO
fully_paid_on = date of the payment that made due <= 0   (display hint only)
completed_on  = set by hand with the "Completed" toggle   (stored)
```

**Completion drives profit.** A sale's profit, tax and net_profit count in the month of its
`completed_on`, for every seller. A sale that isn't completed earns no profit yet, even if it's
fully paid. Cash in, RTO paid and hold always use the actual payment dates.

**Cancelled sales** (`cancelled = true`) have no profit, tax, due or hold. Payments that really
happened still count as cash. A refund is a negative payment. A sale can't be both completed and cancelled.

### Who gets the profit

- **Sale by Tanvir:** 100% of net_profit → Tanvir.
- **Sale by MD:** 100% of net_profit → MD.
- **Sale by an employee:** net_profit split 60% Tanvir / 40% MD. It counts in the month the sale is **completed**.
- **The 20% tax is deducted from the profit of EVERY sale**, whoever made it (Tanvir, MD or an employee).
  Only the remaining 80% (net_profit) goes to the owner(s). For an employee sale, the tax comes off first,
  then the net is split 60/40. Example: profit 1050 → tax 210 → net 840 → Tanvir 504, MD 336.
- Employees' own pay (salary + per-sale commission in BDT) is NOT taken from the sale. It is recorded as an expense.

### Expenses

Each expense has a `split`:

- `shared`: Tanvir 60% / MD 40% (the default)
- `tanvir`: 100% Tanvir
- `md`: 100% MD

A BDT expense (salary, employee commission) stores `original_amount`, `currency = 'BDT'` and `fx_rate`. Then `amount_aud = original_amount / fx_rate`.

### Monthly statement for each partner P, month M (cash view, matches the old "Total" sheet)

```
cash_in        = payments dated in M, on P's own sales
rto_paid       = rto_payments dated in M, on P's own sales
hold_end       = sum(hold) over P's own sales, as of the last day of M
hold_start     = the same, as of the last day of M−1   (last month's hold is released)
tax            = tax_pct × profit of P's own sales completed in M
expense_share  = P's share of expenses dated in M
employee_share = P's share % × net_profit of employee sales completed in M
                 (net_profit is already after the 20% tax, so the tax on employee sales is
                  NOT subtracted a second time in the `tax` line above)

take_home = cash_in − rto_paid − (hold_end − hold_start) − tax − expense_share + employee_share
```

### Profit view (performance, for each month M)

```
partner_profit = net_profit of own sales completed in M
               + employee_share
               − expense_share
company_profit = sum of profit of all sales completed in M − all expenses in M     (before tax)
```

### Test cases (must pass in `src/lib/accounting.test.ts`)

1. Tanvir sale: fee 2500, RTO 1600, referral 0 → profit 900, tax 180, net 720.
2. Employee sale (Reaz): fee 1600, RTO 550 → profit 1050, tax 210, net 840 → Tanvir 504, MD 336.
3. Shared expenses total 1940 → Tanvir 1164, MD 776.
4. BDT salary 22,000 at a rate of 88.4 → 248.87 AUD.
5. Hold: fee 1800, RTO cost 1000, collected 500, RTO paid 0 → hold 500; then collected 1800 → hold 1000; then RTO paid 1000 → hold 0.
6. Instalments: fee 1600, payments 400 + 600 + 600 → status Paid, fully_paid_on = date of the 3rd payment.

**All money math lives in one pure module: `src/lib/accounting.ts`.** Do not compute money inside components.
Data volume is small (about 50 sales a month), so fetch rows and compute on the client.
**Inside the app, money is always integer cents** (`src/lib/money.ts`). Convert at the DB boundary
(`toCents` / `fromCents`) and format only for display. Percentage splits give the remainder to the
second party (`md = total − tanvir`), so the parts always add up exactly to the total.

## Database (Supabase / Postgres)

Keep these tables. Use `numeric(12,2)` for money, `uuid` primary keys, and `created_at` on every table.

- `people`: name, role (`partner` | `employee`), partner_key (`tanvir` | `md`, partners only), active
- `employee_rates` (pay history): person_id → people (employees only), effective_from (date), salary_bdt, commission_per_sale_bdt (both nullable).
  The rate on a date is the latest row starting on or before it; the earliest row also covers earlier dates
  (`rateOn` in `src/features/employees/rates.ts`, SQL `employee_rate_on`). Salaries use the pay date, commissions the sale's completed date.
- `rtos`: name (unique), active
- `courses`: name (unique), active (managed on Settings; sales pick from it, reports group by it)
- `sales`: sale_date, seller_id → people, client_name, phone, email, course_id → courses, rto_id → rtos, course_fee, rto_cost, referral_commission (default 0), source (`Website` | `Reference` | `Repeat client` | `Social Media` | `Whatsapp Text` | `Agent` | `Other`), docs_link, notes, completed_on (date, nullable), cancelled (bool)
- `payments`: sale_id → sales, paid_on, amount, note
- `rto_payments`: sale_id → sales, paid_on, amount, agency (text, e.g. OS / OC / NC), note
- `expenses`: spent_on, category (`Ads` | `Software` | `Phone` | `Salary` | `Employee commission` | `Lead cost` | `Other`), description, amount_aud, original_amount, currency (`AUD` | `BDT`), fx_rate, employee_id → people (nullable), sale_id → sales (nullable, links an employee commission to its sale), split (`shared` | `tanvir` | `md`)
- `sale_notes`: sale_id → sales (cascade), body, pinned
- `sale_tasks`: sale_id → sales (cascade, nullable = general task), title, due_on (nullable), done_at (nullable = open)
- `fx_rates`: month (date, the 1st of the month), aud_to_bdt
- `settings`: key, value (tax_pct, tanvir_share, md_share)
- `invoice_profile` (one row): company / ABN / bank details, number_prefix (`RFT-`), first_number (4528), payment_terms_days, gst_included, default_notes
- `invoices`: invoice_number (unique, case-insensitive), sale_id → sales (nullable)
- `invoice_versions` (immutable): invoice_id, version, issued_on, due_on, bill_to_*, items (jsonb), amount_paid, gst_included, notes, issuer (jsonb snapshot), pdf_path
- Storage: private bucket `invoices`, files at `<invoice id>/<number>_V<n>.pdf` (e.g. `RFT-4528_V2.pdf`, also the download name)

Put SQL migrations in `supabase/migrations/`. Turn on RLS on every table with the policy "authenticated users can do everything". Public sign-ups are disabled in the Supabase dashboard, so Tanvir is the only user.

**Do NOT store** values the system can calculate: due, status, profit, tax, net, the BDT estimate, month text, or the "1st–5th pay" columns.

## Pages (MVP)

1. **Login**: email + password (Supabase Auth).
2. **Dashboard**: month picker (defaults to the current month) and a comparison with the previous month.
   - KPI cards: cash in, RTO paid, expenses, company profit, Tanvir take-home, MD take-home, client dues outstanding, RTO hold.
   - 12-month trend chart (income / expenses / profit).
   - Lists of sales with money due and sales with RTO not yet paid.
3. **Sales**: searchable, filterable table (month, seller, RTO, status).
   - "Add sale" form with a live preview of profit, tax and net.
   - A sale page (`/sales/<id>`) with its payments and RTO payments ("Add payment", "Pay RTO"),
     commission, invoices, and CRM: tasks (due dates, tick off) and notes (pin to the top).
4. **Expenses**: table and form. A BDT↔AUD toggle fills in that month's rate automatically. Split selector.
5. **Employees**: list, salary, per-sale commission, and each employee's sales by month. "Add monthly salaries" creates salary expenses for every active employee in one click.
6. **Monthly statement**: the take-home calculation for Tanvir and MD, shown line by line like a bank statement. Printable, with Excel export.
7. **Tasks**: every sale's tasks grouped by urgency, filterable (status, due, seller, RTO, course, client payment).
   Top bar (every page): search / command box (Ctrl / ⌘ + K), tasks with an open-tasks badge, settings.
   Single-key shortcuts (`N` new sale, `G` then `S` Sales, `?` for the list) live on the command-box commands.
8. **Settings**: tax %, partner shares, monthly FX rates, RTO list, course list, invoice details, backup (Excel of every table).
9. **Invoices**: create from a sale or from scratch in a full-page modal, every field editable, PDF preview.
   Updating an invoice saves a new version with the same number; old versions are kept.

## Conventions

- Roadmap and phase status: `docs/ROADMAP.md`. Build one phase at a time, only when asked.
- Feature folders: `src/features/{sales,tasks,invoices,expenses,employees,dashboard,statement,settings}`. Each has
  `pages/`, `components/`, `api.ts` (queries + mutations), and `schema.ts` (Zod) as needed.
- Theme tokens live in `src/index.css` (custom palette, not shadcn defaults). Use the semantic colours
  `success` (money in), `danger` (money out), `warning` (due/hold), and `info`. Figures use the `money` utility.
- Big forms use the full-page `FormModal` (`src/components/layout/FormModal.tsx`), mounted in `AppLayout`
  and opened through a URL param (e.g. `?invoiceForm=new`) so it works on any page and Back closes it.
  Small edits stay in a normal `Dialog`.
- Shared UI goes in `src/components`. Supabase client in `src/lib/supabase.ts`. Types generated from the DB live in `src/types/db.ts`.
- Money formatting: `$1,234.00` (no `A$`: everything is AUD) and `৳1,23,400` (South Asian grouping for BDT).
- Dates are shown as `dd MMM yyyy`. Business time zone is Australia/Sydney.
- Env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (never commit it).
- Never commit the original Excel file or any client data. `data/` is in `.gitignore`.
- Before saying a task is done, run `npm run build`, `npm run lint` and `npm test`.
- Work in small steps. Ask before adding a new dependency or changing the stack.

## Out of scope for the MVP

Multi-user roles, an employee portal, receipts, emailing invoices, email reminders, bank sync.
