import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center rounded-lg border border-danger/40 bg-danger/5 px-6 py-8 text-center', className)}
    >
      <TriangleAlertIcon className="size-6 text-danger" />
      <p className="mt-2 text-sm font-bold">Couldn't load this</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCwIcon />
          Try again
        </Button>
      )}
    </div>
  )
}
