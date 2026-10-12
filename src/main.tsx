import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Providers } from '@/app/Providers'
import { router } from '@/app/router'
import { SetupRequired } from '@/app/SetupRequired'
import { AppErrorBoundary } from '@/components/feedback/RouteError'
import { reloadOnce } from '@/lib/chunk-reload'
import { isSupabaseConfigured } from '@/lib/supabase'
import './index.css'

// A chunk from the previous deploy failed to load: reload into the new build instead of erroring.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnce()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <Providers>{isSupabaseConfigured ? <RouterProvider router={router} /> : <SetupRequired />}</Providers>
    </AppErrorBoundary>
  </StrictMode>,
)
