import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONES = {
  success: 'bg-success/15 text-success ring-success/30',
  danger: 'bg-danger/15 text-danger ring-danger/30',
  warning: 'bg-warning/15 text-warning-foreground ring-warning/40 dark:text-warning',
  info: 'bg-info/15 text-info ring-info/30',
  primary: 'bg-accent text-accent-foreground ring-primary/25',
  muted: 'bg-muted text-muted-foreground ring-border',
} as const

export type StatusTone = keyof typeof TONES

/** Small pill for states like Paid / Partial / Inactive, in the semantic palette. */
export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full px-2 text-[11px] font-bold whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
