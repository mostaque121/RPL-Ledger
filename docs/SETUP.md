# Setup

## 1. Supabase (one time)

1. **Run the migrations.** In the Supabase dashboard → SQL Editor, paste and run every file in
   `supabase/migrations/`, oldest first (the file names start with the date, so name order is right).
   `…_init.sql` makes the tables, RLS and functions; the `…_seed…` files add Tanvir, MD, the employees,
   RTOs and courses (safe to re-run); the rest add later features (invoices, CRM, pay history, …).

   Or, with the Supabase CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
2. **Create the login.** Authentication → Users → *Add user* → enter email and password, and tick *Auto confirm*.
3. **Turn off sign-ups.** Authentication → Sign In / Providers → turn off *Allow new users to sign up*.
4. **Env vars.** Put these in `.env.local` (never commit it):
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

## 2. Run locally

```
npm install
npm run dev      # http://localhost:5173
npm test         # accounting + formatting unit tests
npm run lint
npm run build
```

## 3. Deploy and back up

- Going live on Cloudflare Pages: [`docs/DEPLOY.md`](DEPLOY.md).
- Keeping a copy of the data: [`docs/BACKUP.md`](BACKUP.md) (and Settings → Backup in the app).

## Project layout

```
src/
  app/            providers, router, navigation config
  components/
    ui/           shadcn components (generated, not hand-edited)
    layout/       sidebar, top bar (page title + PageActions slot), theme toggle
    forms/        form inputs (PasswordInput, later MoneyInput, DatePicker)
    feedback/     loaders, empty / error states, 404, error boundaries
    brand/        logo
  features/
    auth/         login, auth context, protected route
    dashboard/ sales/ tasks/ invoices/ expenses/ employees/ statement/ settings/
    search/       command box (Ctrl / ⌘ + K) and keyboard shortcuts
                  each: pages/, components/, api.ts, schema.ts
  lib/
    accounting.ts all money rules (pure, unit-tested)
    money.ts      integer-cent helpers
    format.ts     A$ / ৳ / date formatting, Sydney "today"
    supabase.ts   client
  types/db.ts     database types
supabase/migrations/  SQL
docs/             ROADMAP.md, SETUP.md, DEPLOY.md, BACKUP.md
```
