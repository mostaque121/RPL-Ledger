import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  /** Usually an "Add …" button. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-10 text-center', className)}>
      <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-bold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
