import { Logo } from '@/components/brand/Logo'

/** Shown instead of the app when `.env.local` has no Supabase URL or key. */
export function SetupRequired() {
  return (
    <div className="grid min-h-svh place-items-center bg-background p-6">
      <div className="w-full max-w-lg space-y-5 rounded-xl border bg-card p-8 shadow-sm">
        <Logo />
        <h1 className="text-xl font-extrabold">Connect Supabase</h1>
        <p className="text-sm text-muted-foreground">
          {import.meta.env.DEV ? (
            <>
              Add your project's URL and publishable key to <code className="font-mono">.env.local</code>, then restart
              <code className="font-mono"> npm run dev</code>.
            </>
          ) : (
            <>
              This build has no Supabase URL or key. Add them as environment variables in Cloudflare Pages
              (Settings → Variables and Secrets), then redeploy. See <code className="font-mono">docs/DEPLOY.md</code>.
            </>
          )}
        </p>
        <pre className="overflow-x-auto rounded-lg bg-sidebar p-4 font-mono text-xs text-sidebar-foreground">
          {`VITE_SUPABASE_URL=https://<project>.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
        </pre>
      </div>
    </div>
  )
}
