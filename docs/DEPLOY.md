# Deploy (Cloudflare Pages)

The app is a static site: `npm run build` writes `dist/`, and Cloudflare Pages serves it. There is no
server of our own; the browser talks to Supabase directly.

## What's already in the repo

| File | Why |
|---|---|
| `.node-version` | Cloudflare builds with Node 22 (Vite 8 needs 20.19+). |
| `public/_headers` | Caches the hashed files in `/assets/` for a year, and adds security headers (no framing, no indexing). |
| `public/robots.txt` | Asks search engines to stay away. `index.html` also has `noindex`. |

**No `_redirects` file is needed.** With no top-level `404.html`, Cloudflare Pages treats the site as a
single-page app and serves `index.html` for every address (`/sales/…`, `/settings/tax`, …), and React
Router takes it from there. (A `/* /index.html 200` rule is flagged by Cloudflare as an infinite loop.)

## First deploy (Git, recommended)

Every push to `main` then deploys by itself.

1. Push the repo to GitHub (a private repo). `.env.local`, `data/` and spreadsheets are ignored, so no
   keys or client data go up. Check with `git status` before the first commit.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repo.
3. Build settings:
   - Framework preset: **React (Vite)** (or None)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Environment variables** (Production, and Preview if you use preview links). They're read at
   *build* time, so changing one needs a new deploy:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   The publishable key is meant to be public; the data is protected by sign-in and RLS.
   Never put the `service_role` / secret key here.
5. **Save and Deploy.** The site is at `https://<project-name>.pages.dev`.

If a build ever shows the "Connect Supabase" screen, the variables were missing at build time:
add them, then **Deployments → Retry deployment**.

## Supabase, after the first deploy

- Authentication → **URL Configuration** → **Site URL**: the `pages.dev` address (or your own domain).
  Add the same under **Redirect URLs**. Sign-in is email + password, so this only matters for
  password-reset links, but keep it right.
- Sign-ups stay **off** (Authentication → Sign In / Providers), so the public URL is safe: only the
  existing login can get in.

## Custom domain: `crm.rplfastrack.com`

The domain's DNS stays at GoDaddy (the main site, `rplfastrack.com` and `www`, is on Vercel). Pages
accepts a subdomain whose DNS is elsewhere, through one CNAME record. Order matters: add the domain in
Pages **first**, then the record at GoDaddy, or the address shows an error until Pages catches up.

1. Pages project → **Custom domains** → **Set up a custom domain** → `crm.rplfastrack.com` → Continue.
   Pages then shows the CNAME it expects.
2. GoDaddy → My Products → `rplfastrack.com` → **DNS** → **Add New Record**:
   - Type **CNAME**, Name **`crm`**, Value **`<project>.pages.dev`** (exactly as Pages shows it), TTL 1 hour.
   - Leave the Vercel records (`@`, `www`) and any email records (MX, TXT) as they are.
3. Back in Pages, the domain goes from *Verifying* to **Active** (minutes, sometimes up to a day). Pages
   issues the HTTPS certificate itself.
4. Supabase → Authentication → **URL Configuration**: Site URL `https://crm.rplfastrack.com`, and add it
   under Redirect URLs (keep `http://localhost:5173` for development).

The `<project>.pages.dev` address keeps working too. That's fine: it's the same app behind the same login.

## Deploy without Git (manual)

```
npm run build
npx wrangler pages deploy dist --project-name rpl-ledger
```

The build uses your local `.env.local`. Wrangler asks you to log in to Cloudflare the first time.

## Updating

Push to `main` (or run the manual deploy). Tabs that are already open keep working: if one tries
to open a page from the old build, the app reloads itself into the new one.

## Before each deploy

```
npm run build
npm run lint
npm test
```

New SQL in `supabase/migrations/`? Run it in the Supabase SQL Editor **before** deploying the code
that needs it.
