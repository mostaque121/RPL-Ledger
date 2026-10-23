# RPL Ledger — Roadmap

The whole project, split into phases. Each phase is small enough to build, test, and review
in one sitting. We do them **one at a time, only when Tanvir says "go"**.

Status key: ⬜ not started · 🟨 in progress · ✅ done

Every phase ends with `npm run build`, `npm run lint`, `npm test`, all green.

---

## ✅ Phase 1 — Foundation

- Vite + React + TS (strict) + Tailwind v4 + shadcn/ui (Radix). Custom theme: Plus Jakarta Sans
  and JetBrains Mono for figures. High-contrast "ink & indigo" palette, light and dark.
- App shell: dark sidebar (Dashboard, Sales, Expenses, Employees, Statement, Settings), top bar
  with theme toggle and sign-out, mobile drawer.
- Supabase client, email/password login, protected routes.
- SQL migration: every table, constraints, indexes, `updated_at` triggers, RLS, helper RPCs, seed.
- `src/lib/accounting.ts`: all money rules in integer cents, with Vitest tests.

## ✅ Phase 2 — Settings & master data

- **Settings page:** tax %, partner shares (must total 100), monthly AUD→BDT rates (add/edit, with a
  "copy last month" shortcut), RTO list and course list (add / rename / deactivate / remove when unused).
- **People:** add / edit / deactivate / delete (delete only when the person has no history).
  Salary and per-sale commission in BDT.
- Shared building blocks: the data-hook pattern (`useXQuery` / `useXMutation`), `MoneyInput`,
  `DatePicker`, `MonthPicker`, `ConfirmDialog`, empty / loading / error states.
- Built: `useAppMutation` (refetch + toast), `unwrap` / `friendlyDbError` (Postgres codes → plain
  messages), `QueryView`, `StatusBadge`, `PercentInput`, `lib/month.ts`. People live on the Employees
  page (partners: rename only); Settings has tax & shares (with a worked example), FX rates and RTOs.

## ✅ Phase 3 — Sales

- Sales table (TanStack Table): search, filters (month, seller, RTO, payment status, completed,
  cancelled), sortable, totals row.
- Add/Edit sale form with searchable seller / RTO / course pickers (add a new course inline) and a **live preview** of profit, tax, net, and who gets what.
- Sale detail drawer: payments and RTO payments (add / edit / delete), due, hold, RTO due.
- **Mark as completed** toggle (choose the date, defaults to today). Mark cancelled / restore.
- When an employee sale is completed, offer to add that employee's commission expense in one click.
- Built: `Combobox` (searchable picker, no new dependency), filters and the open sale kept in the URL
  (`/sales?month=all&payment=due&sale=<id>`), optional "Paid today?" first payment on the add form,
  agency suggestions from earlier RTO payments, `salesTotals` in `accounting.ts`.
- Migration 0005: `expenses.sale_id` links a commission expense to its sale (one per sale).

## ✅ Phase 4 — Expenses

- Expenses table with filters (month, category, split, employee) and month totals.
- Form: AUD/BDT toggle (fills that month's FX rate automatically), split selector, employee link
  for salary/commission.
- **"Add monthly salaries"** button (one RPC call; skips anyone already paid that month).
- Built: summary tiles (total, Tanvir pays, MD pays, top categories), split preview in the form,
  picking an employee prefills their salary / commission in taka, commission expenses link back to their sale.
- Shared pieces pulled out for later pages: `DataTable` (sortable + totals footer), `Amount`,
  `useUrlFilters`, `MonthFilter`, `FilterSelect`, `SearchInput`, `Segmented`. Sales now uses them too.
- `accounting.ts`: `expenseTotals`, `sumBdtAsAud`.

## ✅ Phase 5 — Employees

- Employee list with this month's sales count, salary, and commission.
- Employee detail: sales by month, completed vs open, commission paid vs owed.
- Built: month picker on the list (sales, completed, salary paid / not paid for that month; commission
  owed is all-time), a detail drawer (`/employees?employee=<id>`) with totals, net profit brought in,
  a "commission owed" list with add-one / **add all** (one insert), and a by-month table.
- `features/employees/stats.ts` (tested): per-month, history and overview figures. Shared
  `useUrlParam`; `commissionPlan` (pure) next to `useCommissionPlan`.

## ✅ Phase 6 — Monthly statement

- Take-home for Tanvir and MD, line by line like a bank statement, with drill-down to the rows
  behind each line.
- Print-friendly layout and Excel export (SheetJS).
- Built: In / Out / Balance columns, comparison with last month's take-home, expand / collapse all,
  links from rows to their sale, a "Profit view" card (company and partner profit for the month).
  Excel: a Summary sheet plus a detail sheet per partner. Print hides the app frame and always uses
  the light palette.
- `accounting.ts`: `monthlyStatementDetail` returns the rows behind every line; `monthlyStatement`
  is now a wrapper around it, so the totals and the drill-down can't disagree.
- SheetJS is in its own chunk, loaded only when "Excel" is clicked.

## ✅ Phase 7 — Dashboard

- Month picker (defaults to the current month in Sydney time) with a comparison to the previous month.
- KPI cards: cash in, RTO paid, expenses, company profit, Tanvir take-home, MD take-home,
  client dues, RTO hold.
- 12-month trend chart (income / expenses / profit), lists of sales with money due and sales with RTO unpaid.
- Profit by course and by RTO (completed sales in the month / year).
- Built: each KPI shows its change vs last month (green / red only where up is clearly good or bad)
  and links to the page behind it; the chart has a Chart / Table toggle, a tooltip, and click-a-month
  to jump; "year" = January to the picked month. Sales gained an "RTO pay: not paid" filter.
- Chart colours (blue cash in, orange expenses, magenta profit) were checked with the dataviz palette
  validator in light and dark; green/red failed colour-blind separation, so they stay for text only.
- `accounting.ts`: `companyMonth`, `profitByGroup`. Recharts and SheetJS are on-demand chunks.

## ✅ Phase 7b — Invoices (added on request)

- **Invoices page:** one row per invoice number (latest version), search, status (Due / Overdue / Paid),
  totals. A drawer previews the PDF, downloads / opens it, and lists every version.
- **Versions, not copies:** "Update invoice" (e.g. after an instalment) saves version 2, 3, … with the
  **same number**. Old versions and their PDFs are kept and can be previewed or downloaded.
- **Create from a sale or from scratch:** "Create invoice" in the sale drawer opens the form right there
  fills client, course line and amount paid; on the Invoices page a sale can be linked (or not).
  Every field stays editable: number, dates, client, items (course suggestions or free text), paid,
  GST, notes, and even the company / bank details for that one invoice.
- **Numbering:** prefix + one more than the highest number used, starting at `RFT-4528` (Settings).
- **Settings → Invoice details:** company, ABN, bank, prefix / start number, payment terms, GST, notes.
- **Form:** an app-wide full-page modal (`FormModal`, mounted in the layout, in the URL as
  `?invoiceForm=new[&invoiceSale=<id>]` or `?invoiceForm=<invoice id>`, so it opens on any page and
  Back closes it) laid out like the invoice itself (letterhead, bill to, number / dates, items,
  totals, bank + notes). A **Preview** button renders the exact PDF before anything is saved;
  leaving with unsaved changes asks first.
- **PDF:** the original RPL Fast Track design (header tidied), rendered in the browser with
  `@react-pdf/renderer` (own on-demand chunk), uploaded to the private Supabase Storage bucket `invoices` (`<invoice id>/RFT-4528_V<n>.pdf`, also the download name).
- Migration 0006: `invoice_profile`, `invoices`, `invoice_versions`, the bucket + policies, and
  `save_invoice_version` (creates the invoice and its version in one transaction).
- `accounting.ts`: `invoiceTotals` (total, GST = 1/11, paid, due). `features/invoices`: `numbering`,
  `draft` (prefill rules) and `filters`, all tested.

## ✅ Phase 7c — Sale page, tasks & notes (added on request)

- **Sale page** (`/sales/<id>`) replaces the sale drawer: header with client, course / RTO, badges, contact
  buttons (call, email, documents) and actions; pinned notes; the money summary; payments, RTO
  payments, commission and invoices on the left; tasks and notes on the right (first on phones).
  "All sales" goes back to the list with its filters. Every link to a sale now opens this page.
- **Tasks:** quick add with an optional due date (Today / Tomorrow / Next week / any date), tick off,
  edit, delete. Open tasks sort soonest first; done ones fold away. Due chips: overdue (red), today
  (amber), this week (blue).
- **Notes:** write (Ctrl + Enter saves), edit in place, delete, **pin**. Pinned notes sit under the
  sale header. The old free-text "notes" on the sale form stays and shows as "From the sale form".
- **Dashboard:** a "Tasks to do" list (overdue + next 7 days) next to the two money lists.
- **Tasks page** (`/tasks`, in the sidebar with a red / amber badge for overdue / due-today tasks): every task
  grouped Overdue → Due today → This week → Later → No due date → Done. Tiles (open, overdue, today,
  this week) are filter shortcuts. Filters in the URL: search (task, client, course, RTO, seller),
  status (open by default), due, type (sale / general), seller, RTO, course, client payment status.
  "New task" can link a sale or not: **general tasks** (migration 0008 makes `sale_tasks.sale_id` nullable).
  `features/tasks/filters.ts` is tested.
- Migration 0007: `sale_notes`, `sale_tasks` (cascade with the sale, RLS). `features/sales/crm.ts`
  (due states, labels, ordering) is tested.

## ✅ Phase 7d — Employee page (added on request)

- **Employee page** (`/employees/<id>`) replaces the employee drawer. Clicking a row on the Employees list
  opens it on the month picked there; the top-bar back arrow returns to the list with its filters.
- **Header:** name, active / inactive, today's pay, "since" (first sale or payment), Edit pay, and links to
  their rows in Sales and Expenses for the same period.
- **Month or all time** (`?month=2026-09` / `?month=all`). Tiles: sales made, completed (and open right now),
  net profit brought in (with the Tanvir / MD split), paid to them (salary + commission), left after their
  pay, and commission owed (all time). In a month, each tile shows the change vs the month before.
- **Activity chart:** last 12 months, net profit brought in vs paid to them, sales counts in the tooltip,
  click a month to open it. A Table toggle shows every month with activity.
- **Tabs** (in the URL): Sales (sold in / completed in the month, with fee, due, net profit and commission
  paid or owed; rows open the sale), Payment history (every salary and commission with taka, rate and A$),
  Commission owed (add one / add all), Pay rates.
- `features/employees/stats.ts`: `employeePeriod` (a month or all time) and `employeeTrend`, both tested.

## ✅ Phase 8 — Loading skeletons (added on request)

- Every page shows its real frame straight away (top-bar title, actions, tabs, search, filters, month
  pickers, section headings and labels). Only the parts waiting for data become placeholders.
- Each placeholder is shaped like the content that replaces it: tables keep their real column headers
  (the viewer's own columns on Sales and Expenses) with rows of bars in each cell's shape (two-line
  client cells, badges, right-aligned amounts); KPI tiles keep their labels and icons; cards, lists,
  charts and the sale and employee pages keep their layout. When the data arrives, nothing jumps.
- Tab count pills show a small placeholder while counting. Inner loads (a sale's notes, tasks and
  activity) use list-shaped placeholders too.
- Built: `SkeletonText` (a bar the exact height of a line of text at a given size), `LoadingRegion`
  (one screen-reader announcement), `DataTableSkeleton` (reads a table's own column definitions; each
  column says its loading shape in `meta.skeleton`), `ChartSkeleton` (12-month column chart), `QueryView`
  `loading` slot, `UnderlineTabsTrigger` `countPending`. Each list, card and panel has its skeleton in
  its own file (`SalesTableSkeleton`, `KpiGrid` with `data={null}`, `SaleDetailSkeleton`,
  `EmployeeDetailSkeleton`, `TaxSharesSkeleton`, …). Table styles moved to `components/data/table-styles.ts`
  and the sale page's layout classes to `features/sales/components/detail/layout.ts`, shared by page and skeleton.
- Fixed on the way: the sale page briefly said "Sale not found" while settings loaded; the Employees page
  said "No AUD→BDT rate" while rates loaded.
- The full-screen spinner on a cold start (while sign-in is checked) and the sale / invoice form modals
  keep their simple loaders.

## ✅ Phase 9 — Top-bar shortcuts (added on request)

- Right side of the top bar, after the page's own buttons: **search**, **tasks** (badge with the open
  tasks, red when some are overdue; opens the Overdue tab then), **settings** (hidden on phones, it's in
  the menu) and the theme toggle. Each has a tooltip.
- **Command box** (`cmdk`): the search icon, Ctrl / ⌘ + K anywhere, or "/" outside a text field.
  - Before typing: quick actions, the 5 most recent sales, and the pages.
  - Typing searches sales (client, phone with any spacing, email, course, RTO, seller), invoices
    (number, client, item), employees, tasks (title, client) and expenses (description, category,
    employee), plus actions, pages and every settings section. Every word must match, in any order;
    names starting with the query come first, then the newest. 5 per kind, with "See all N" opening
    the page with the same search.
  - Quick actions: new sale, expense, invoice, task, employee; add monthly salaries; dark / light mode.
  - Arrows, Enter, Esc. It loads its data only when first opened (usually already cached).
- Built: `features/search/search.ts` (pure, tested), `components/ui/command.tsx` (cmdk in the app's
  palette, plus `Kbd`), `useAddDialog` (`?add=expense|salaries|task|employee` opens a page's add dialog,
  so it works from anywhere and Back closes it).

## ✅ Phase 10 — Polish & deploy

- **Branding:** open-book logo (sidebar, login), favicon + touch icon, meta tags (`noindex`), tab title
  `<Page> · RPL Ledger` (`useDocumentTitle`).
- **Errors:** a page that crashes shows "Something went wrong" (Reload / Dashboard, technical details
  folded away) inside the frame, so the sidebar keeps working (`PageError`). Sign-in and the frame itself
  fall back to a full-screen version (`AppError`, `AppErrorBoundary` around the providers).
- **New version:** a page chunk from an older deploy (tab left open over a deploy) reloads into the new
  build once (`vite:preloadError` + `lib/chunk-reload.ts`), else shows "A new version is ready".
- **404:** unknown addresses show "Page not found" in the frame (Go back / Dashboard) instead of
  silently going to the dashboard.
- **Keyboard shortcuts** (off while typing or with a dialog, drawer, form or menu open):
  `N` sale, `E` expense, `I` invoice, `T` task; `G` then `D S T I E P M ,` for Dashboard, Sales, Tasks,
  Invoices, Expenses, Employees (People), Statement (Monthly), Settings; `?` lists them all (also in the
  command box and the user menu). Each shortcut is defined once on its command (`useCommands`), and the
  command box shows it. Matching is pure and tested (`features/search/shortcuts.ts`).
- **Toasts:** every save already toasted (`useAppMutation`). Added: Excel export done, a failed background
  refresh (data stays on screen), offline / back online.
- **Backup:** Settings → Backup downloads one `.xlsx` with every table (all rows, paged past 1000) and a
  contents sheet (`features/settings/backup.ts`, tested). `docs/BACKUP.md`: what Supabase keeps per plan,
  `pg_dump` copy and restore.
- **First load:** form libraries (zod, react-hook-form, date picker) and table libraries (TanStack Table,
  dnd-kit) are their own on-demand chunks instead of part of `vendor`, and the login page is lazy. First
  download went from ~387 KB to ~309 KB gzipped; the dashboard needs neither chunk.
- **Deploy:** Cloudflare Pages via Git (`docs/DEPLOY.md`). `.node-version` (22), `public/_headers`
  (immutable `/assets/*`, security headers, `noindex`), `robots.txt`. No `_redirects`: without a `404.html`
  Pages serves `index.html` for every path.

---

## Decisions made so far

| Topic | Decision |
|---|---|
| Profit recognition | Profit, tax, and the partner split count in the month a sale is **marked completed** (`completed_on`), for every seller. Full payment is shown as a hint only. |
| Cash view | Cash in, RTO paid, and hold always use the actual payment dates. |
| Cancelled sales | No profit, tax, due, or hold. Money actually received or paid still shows as cash. Refunds are negative payments. |
| Refunded sales | A cancelled sale with a client refund (negative payment). Not stored: derived. "Refund client" on the sale page adds the refund and cancels the sale in one step. Shows a Refunded badge and has its own State filter. |
| Money in code | Integer **cents** everywhere in the app. Dollars only at the DB boundary and on screen. |
| Partner identity | `people.partner_key` = `tanvir` / `md`, not matched on names. |
| Removing people | People with history are **deactivated**, not deleted. |
| Migrations | Plain SQL in `supabase/migrations/`. Paste into the SQL Editor, or run `supabase db push`. |
| Usage counts | "Can this be deleted?" uses PostgREST embedded counts (`sales(count)`), no extra views. The FK `on delete restrict` is the real guard. |
| RTOs & courses | Both are managed lists (`rtos`, `courses`) sharing one component. Used ones can be deactivated (hidden from new sales) but not deleted. `sales.course_id` replaced the free-text `course` (migration 0003). |
| BDT in the app | Salary / commission are whole taka (`number`); only AUD is kept in cents. Money inputs report minor units. |
| FX "copy last month" | Copies the newest rate to the following month, one month at a time, up to next month. |
| Sales list | All sales are fetched once (with payments, RTO payments and commission embedded) and filtered on the client. The month filter uses the sale date and defaults to this month. |
| Commission expense | Booked on the completed date at that month's FX rate, split shared, linked by `expenses.sale_id`. Reopening a sale keeps it; it can be removed from the sale drawer. |
| Deleting a sale | Allowed (payments go with it) for mistakes; real sales should be cancelled instead. A linked commission expense is kept. |
| Expense FX rate | Auto-filled from the month of the expense date until typed by hand; a typed rate is kept, with a "Use it" link back to the month's rate. Each BDT expense stores its own rate. |
| List filters in the URL | Every list page keeps its filters in the URL; a filter at its default is left out (`/expenses?category=Salary`, `/sales?month=all&payment=due`). |
| Commission owed | A completed, not-cancelled employee sale with no linked commission expense. Commission added by hand on the Expenses page without a sale link isn't matched, so add it from the sale or the employee drawer. The ৳ owed uses the employee's current per-sale rate. |
| Invoice versions | Updating an invoice adds an immutable version with the same number; nothing is overwritten. The list shows the latest; the drawer shows all. Versions store a snapshot (items, paid, company/bank as printed) plus the PDF path; total and due are calculated. |
| Invoice PDFs | Made in the browser (no backend), stored in a **private** bucket, fetched through the signed-in API. Deleting an invoice removes every version and PDF and frees the number. |
| Big forms | `components/layout/FormModal`: a full-page sheet that slides up over the content area beside the sidebar (the whole screen on phones), header with ✕ / title / actions, actions in a sticky footer on phones. Non-blocking: the sidebar stays clickable, outside clicks don't close it. Opened through a URL param so Back closes it; mounted in `AppLayout` so it opens on any page (pages hide their own drawers meanwhile). Invoices use it first. |
| Invoice ↔ sale | Optional link. A new version of a linked invoice takes the amount paid from the sale's payments (editable). Invoices don't affect any accounting figure. |
| Employee page vs drawer | An employee opens on their own page (`/employees/<id>?month=…`), like a sale, so there's room for a chart, the month filter and the payment history. "Left after their pay" = net profit (after tax) of their completed sales − salary and commission paid in the period. |
| Sale page vs drawer | A sale opens on its own page (`/sales/<id>`), not a drawer, so there's room for tasks and notes. Big forms still use `FormModal`, small edits a `Dialog`. |
| Tasks & notes | CRM only: they never affect money. All tasks are fetched once (shared by the dashboard and the sale page); notes are fetched per sale. Both are deleted with their sale. |
| Loading states | Only what waits for data is a placeholder; titles, filters, tabs, labels and buttons render at once. Placeholders are built from the same column definitions, labels and layout classes as the real thing, so they can't drift apart. |
| Command box | Our own matching (`searchRecords`), cmdk only for the keyboard and list. Results link to the record's page; tasks open their sale, expenses and "See all" open the list with the search filled in. |
| Dashboard balances | Client dues and RTO hold are "as at the end of the picked month". Dues count only sales dated by then; hold counts any money already received (same as the statements). The two attention lists show how things stand right now. |
| Unknown URLs | A 404 page inside the frame, not a redirect to the dashboard. |
| Single-key shortcuts | Defined on the command-box commands; ignored while typing or when any dialog / menu is open. |
| Backups | In-app Excel export of every table + `pg_dump` guide. No restore from Excel in the app. |
| SPA hosting | Cloudflare Pages' built-in SPA fallback (no `404.html`), no `_redirects`. |
