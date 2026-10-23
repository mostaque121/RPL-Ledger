import type { ComponentProps } from 'react'
import { Tabs } from 'radix-ui'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Underlined tabs (the sale page's style): a bottom border with a thick bar under the active tab,
 * and an optional count pill. Use inside a `Tabs.Root` from `radix-ui`.
 */
export function UnderlineTabsList({ className, ...props }: ComponentProps<typeof Tabs.List>) {
  return <Tabs.List className={cn('flex gap-1 overflow-x-auto border-b scrollbar-none', className)} {...props} />
}

interface TriggerProps extends ComponentProps<typeof Tabs.Trigger> {
  /** Shown in a pill after the label (hidden when 0 unless `showZero`). */
  count?: number
  showZero?: boolean
  /** The count is still loading: a placeholder pill keeps its place. */
  countPending?: boolean
  /** `warning` colours the count pill, for a tab that needs attention. */
  tone?: 'warning'
}

export function UnderlineTabsTrigger({ className, children, count, showZero, countPending, tone, ...props }: TriggerProps) {
  return (
    <Tabs.Trigger
      className={cn(
        'group relative inline-flex shrink-0 items-center gap-1.5 px-3 pt-2 pb-3 text-sm font-semibold whitespace-nowrap text-muted-foreground outline-none transition-colors',
        'after:absolute after:inset-x-2 after:bottom-0 after:h-0.75 after:rounded-full after:bg-transparent after:transition-colors',
        'hover:text-foreground focus-visible:text-foreground focus-visible:after:bg-ring data-[state=active]:text-foreground data-[state=active]:after:bg-foreground',
        className,
      )}
      {...props}
    >
      {children}
      {countPending && <Skeleton aria-hidden className="h-4.5 w-5 rounded-full" />}
      {!countPending && count !== undefined && (count > 0 || showZero) && (
        <span
          className={cn(
            'money rounded-full px-1.5 text-[11px] leading-4.5 font-bold',
            tone === 'warning' && count > 0
              ? 'bg-warning text-warning-foreground'
              : 'bg-muted text-muted-foreground group-data-[state=active]:bg-foreground group-data-[state=active]:text-background',
          )}
        >
          {count}
        </span>
      )}
    </Tabs.Trigger>
  )
}
