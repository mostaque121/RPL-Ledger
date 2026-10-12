# Backups

All the data lives in one Supabase project. Keep your own copy as well. There are two ways:

| | Excel backup (in the app) | Full database copy (`pg_dump`) |
|---|---|---|
| How | Settings → Backup → **Download backup** | A command on your computer |
| Gives you | One `.xlsx`: every table, every row | A `.sql` file that rebuilds the whole database |
| Good for | Reading, checking, a monthly habit | Restoring, or moving to a new Supabase project |
| Needs | Nothing | PostgreSQL client tools and the database password |

Both files contain client names, phones and emails. Keep them somewhere private (not in this repo:
`/backups/` and `data/` are git-ignored), and delete old ones you don't need.

**Suggested habit:** download the Excel backup on the 1st of every month, and take a `pg_dump` copy
every few months and before any big change (new migrations, moving projects).

## What Supabase keeps for you

Look at **Dashboard → Database → Backups** for your project.

- **Paid plans (Pro and up)** keep daily backups for a few days (7 on Pro at the time of writing) and
  can restore one from that page. Point-in-time recovery is a paid add-on.
- **Free plan** gives you no backups you can download or restore yourself, so your own copies are
  the only safety net. Free projects are also **paused after about a week with no activity**. The data
  is kept, and you can resume the project from the dashboard.

Plans change, so check the Supabase pricing page for the current details.

## Excel backup

Settings → **Backup** → **Download backup (.xlsx)**. You get `RPL Ledger backup <date>.xlsx`:

- **Contents** sheet: when it was made and the row count of each table.
- One sheet per table (`sales`, `payments`, `rto_payments`, `expenses`, `people`, …) with every column as
  stored, ids included. Amounts are AUD dollars. JSON columns (invoice items, issuer) are JSON text.
- **Not included:** the invoice PDFs (they're files in Storage). Every invoice version's data *is*
  included, so they can be made again.

To put data back from it, export a sheet as CSV and use the Supabase **Table Editor → Insert → Import
data from CSV**, parents first (people, rtos, courses, then sales, then payments, …). For a full
restore, the `pg_dump` copy below is much easier.

## Full database copy with `pg_dump`

### 1. Get the connection string

Dashboard → **Connect** (top of the project) → **Session pooler** (works on IPv4 networks). It looks like:

```
postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Replace `[YOUR-PASSWORD]` with the database password (Project Settings → Database → reset it there if
you've lost it). Don't save this string in the repo.

### 2. Take the copy

You need `pg_dump` at least as new as the database (Project Settings → Infrastructure shows the
Postgres version). PostgreSQL 17 client tools work for both 15 and 17.

PowerShell:

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
$date = Get-Date -Format yyyy-MM-dd
pg_dump "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" `
  --schema=public --no-owner --no-privileges --file "backups/rpl-ledger-$date.sql"
```

This saves the app's tables, data, functions, triggers and RLS policies. It does **not** include the
login user (`auth` schema) or the Storage files.

The invoice PDFs: Dashboard → **Storage** → `invoices` bucket, download the folders if you want them too.

### 3. Restore into a new (empty) Supabase project

1. Create the project. Don't run the migrations: the dump already has the tables.
2. Load the copy with the new project's Session pooler string:
   ```powershell
   psql "postgresql://postgres.<new-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" `
     --single-transaction --file backups/rpl-ledger-<date>.sql
   ```
3. Recreate the login (Authentication → Users → Add user, *Auto confirm*) and turn sign-ups off,
   as in `docs/SETUP.md`.
4. Create the private Storage bucket `invoices`: in the SQL Editor, run the last section of
   `supabase/migrations/20261012000006_invoices.sql` (from `storage: private invoices bucket` to the end).
   The dump is `public` only, so it doesn't bring the bucket. Then upload the PDF folders if you saved them.
5. Point the app at the new project: update `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in
   `.env.local` and in Cloudflare Pages, then redeploy (see `docs/DEPLOY.md`).

Restoring over the *same* project is safest from **Database → Backups** on a paid plan. Restoring a
dump over existing tables will clash, so use a fresh project, or ask before dropping anything.
