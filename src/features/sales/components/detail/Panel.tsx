import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A card on the sale page. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl bg-card p-4 ring-1 ring-foreground/10', className)}>{children}</div>
}
