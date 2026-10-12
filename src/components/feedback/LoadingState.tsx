import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Placeholder rows while a list or form loads. */
export function LoadingState({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}
