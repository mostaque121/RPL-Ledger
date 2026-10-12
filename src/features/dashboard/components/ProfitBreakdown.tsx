import type { LucideIcon } from 'lucide-react'
import { pickWidth } from '@/components/feedback/skeleton-widths'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProfitGroup } from '@/lib/accounting'
import { formatAudShort } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProfitBreakdownProps {
  title: string
  icon: LucideIcon
  /** Biggest profit first. A null key is "No course" / "No RTO". Null while sales load. */
  groups: ProfitGroup<string | null>[] | null
  noneLabel: string
  limit?: number
}

/**
 * Profit of completed sales by course or RTO. One series, so one colour and no legend;
 * bars are scaled to the biggest group, with the value written beside each.
 */
const NAME_WIDTHS = ['w-48', 'w-36', 'w-40', 'w-28', 'w-32'] as const
const BAR_WIDTHS = ['w-full', 'w-4/5', 'w-3/5', 'w-2/5', 'w-1/4'] as const

/** Placeholder rows: a name, a count · amount, and a bar shrinking down the list like the real one. */
function RowsSkeleton() {
  return (
    <ul className="mt-3 space-y-2.5" aria-hidden>
      {BAR_WIDTHS.map((bar, i) => (
        <li key={bar}>
          <div className="flex items-center justify-between gap-3">
            <SkeletonText className={pickWidth(NAME_WIDTHS, i)} />
            <SkeletonText size="xs" className="w-20" />
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <Skeleton className={`h-full rounded-full bg-foreground/10 ${bar}`} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ProfitBreakdown({ title, icon: Icon, groups, noneLabel, limit = 8 }: ProfitBreakdownProps) {
  const shown = (groups ?? []).slice(0, limit)
  const max = Math.max(1, ...shown.map((g) => Math.abs(g.profit)))
  const rest = (groups?.length ?? 0) - shown.length

  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </h2>
      {!groups ? (
        <RowsSkeleton />
      ) : shown.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No completed sales in this period.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {shown.map((g) => (
            <li key={g.key ?? '—'} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate font-medium">{g.key ?? noneLabel}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {g.count} sale{g.count === 1 ? '' : 's'} ·{' '}
                  <span className={cn('money font-bold text-foreground', g.profit < 0 && 'text-danger')}>{formatAudShort(g.profit)}</span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-profit"
                  style={{ width: `${(Math.max(0, g.profit) / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {rest > 0 && <p className="mt-2 text-xs text-muted-foreground">+ {rest} more</p>}
    </section>
  )
}
