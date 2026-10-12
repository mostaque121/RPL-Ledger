import { Loader2Icon } from 'lucide-react'

export function FullScreenLoader() {
  return (
    <div className="grid min-h-svh place-items-center bg-background" role="status" aria-label="Loading">
      <Loader2Icon className="size-6 animate-spin text-primary" />
    </div>
  )
}
