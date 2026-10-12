import type { ComponentProps, ReactNode } from 'react'
import { PlusIcon, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** One item in a card list (a payment, note, task…). */
export const LIST_CARD = 'rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm'

const TONES = {
  primary: 'bg-accent text-accent-foreground',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning-foreground dark:text-warning',
  info: 'bg-info/15 text-info',
} as const

export type SectionTone = keyof typeof TONES

interface SectionHeaderProps {
  icon: LucideIcon
  tone?: SectionTone
  title: ReactNode
  count?: number
  /** Usually the "Add …" button, on the right. */
  action?: ReactNode
  className?: string
}

/** Icon, title and count on the left, the main action on the right. Every section on a detail page uses it. */
export function SectionHeader({ icon: Icon, tone = 'primary', title, count, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex min-h-8 items-center justify-between gap-3', className)}>
      <h3 className="flex min-w-0 items-center gap-2.5 text-base font-bold">
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', TONES[tone])}>
          <Icon className="size-4" />
        </span>
        <span className="truncate">{title}</span>
        {count !== undefined && (
          <span className="money rounded-full bg-muted px-2 text-xs leading-5 font-bold text-muted-foreground">{count}</span>
        )}
      </h3>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

/** The "Add …" button in a section header. Same look in every section; pass `icon` to swap the plus. */
export function AddButton({ icon: Icon = PlusIcon, children, ...props }: { icon?: LucideIcon } & ComponentProps<typeof Button>) {
  return (
    <Button size="sm" variant="outline" {...props}>
      <Icon />
      {children}
    </Button>
  )
}

/** The dashed card shown when a list is empty. */
export function SectionEmpty({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {Icon && <Icon className="size-5 opacity-60" />}
      {children}
    </div>
  )
}
