import { LoadingRegion, SkeletonText } from '@/components/feedback/SkeletonText'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Bar heights (% of the plot) for 12 months, two bars each: fixed, so the placeholder doesn't flicker between renders. */
const HEIGHTS = [
  [45, 30], [60, 35], [40, 28], [70, 42], [55, 38], [80, 45],
  [62, 40], [50, 33], [75, 48], [58, 36], [85, 50], [68, 44],
] as const

interface ChartSkeletonProps {
  /** The chart's own height class, e.g. `h-72`. */
  className: string
  months?: number
}

/**
 * A 12-month column chart while its data loads: the y-axis labels' 64px gutter, gridlines,
 * pairs of columns and the month labels, at the chart's own height.
 */
export function ChartSkeleton({ className, months = 12 }: ChartSkeletonProps) {
  return (
    <LoadingRegion label="Loading chart" className={cn('flex w-full flex-col pt-2 pr-2', className)}>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-16 shrink-0 flex-col justify-between pr-2" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonText key={i} size="xs" align="right" className="w-9" />
          ))}
        </div>
        <div className="relative flex flex-1 items-end justify-around border-b" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="absolute inset-x-0 border-t" style={{ top: `${i * 25 + 2}%` }} />
          ))}
          {HEIGHTS.slice(0, months).map(([a, b], i) => (
            <div key={i} className="relative flex h-full items-end gap-0.5">
              <Skeleton className="w-3 rounded-t-sm rounded-b-none sm:w-4" style={{ height: `${a}%` }} />
              <Skeleton className="w-3 rounded-t-sm rounded-b-none sm:w-4" style={{ height: `${b}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-16 flex justify-around pt-1.5" aria-hidden>
        {HEIGHTS.slice(0, months).map((_, i) => (
          <SkeletonText key={i} size="11px" className={cn('w-8', i % 2 === 1 && 'max-sm:invisible')} />
        ))}
      </div>
    </LoadingRegion>
  )
}
