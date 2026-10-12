import type { LucideIcon } from 'lucide-react'
import { ArrowRightIcon, CircleCheckIcon } from 'lucide-react'
import { Link } from 'react-router'
import { pickWidth } from '@/components/feedback/skeleton-widths'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { Skeleton } from '@/components/ui/skeleton'
import { saleHref } from '@/features/sales/links'
import type { SaleView } from '@/features/sales/api/sales'
import { formatAudShort } from '@/lib/format'
import type { Cents } from '@/lib/money'

interface AttentionListProps {
  title: string
  icon: LucideIcon
  /** Already filtered and sorted. Null while sales load. */
  sales: SaleView[] | null
  amount: (sale: SaleView) => Cents
  /** Small text under the client name. */
  detail: (sale: SaleView) => string
  total: Cents | null
  tone: string
  /** The full, filtered Sales list. */
  seeAll: string
  empty: string
  limit?: number
}

const NAME_WIDTHS = ['w-32', 'w-40', 'w-28', 'w-36'] as const
const DETAIL_WIDTHS = ['w-44', 'w-36', 'w-48', 'w-40'] as const

/** Rows of a dashboard list while it loads: a name, a detail line and something on the right (an amount or a chip). */
export function ListRowsSkeleton({ rows = 6, right = 'amount' }: { rows?: number; right?: 'amount' | 'chip' }) {
  return (
    <ul className="divide-y" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-2.5">
          <span className="min-w-0 flex-1">
            <SkeletonText className={pickWidth(NAME_WIDTHS, i)} />
            <SkeletonText size="xs" className={pickWidth(DETAIL_WIDTHS, i)} />
          </span>
          {right === 'amount' ? <SkeletonText className="w-14" /> : <Skeleton className="h-5 w-16 rounded-full" />}
        </li>
      ))}
    </ul>
  )
}

/** The "See all" link's place while a list loads. */
export function ListFooterSkeleton() {
  return (
    <div aria-hidden className="mt-auto flex justify-center border-t p-2.5">
      <SkeletonText size="xs" className="w-16" />
    </div>
  )
}

/** A short "needs action" list (money due, RTO unpaid), linking into Sales. */
export function AttentionList({
  title,
  icon: Icon,
  sales,
  amount,
  detail,
  total,
  tone,
  seeAll,
  empty,
  limit = 6,
}: AttentionListProps) {
  return (
    <section className="flex flex-col rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Icon className="size-4 text-muted-foreground" />
            {title}
          </h2>
          {sales ? (
            <p className="text-xs text-muted-foreground">
              {sales.length} sale{sales.length === 1 ? '' : 's'} right now
            </p>
          ) : (
            <SkeletonText size="xs" className="w-24" />
          )}
        </div>
        {total !== null ? (
          <p className={`money text-lg font-extrabold ${tone}`}>{formatAudShort(total)}</p>
        ) : (
          <SkeletonText size="lg" className="w-20" />
        )}
      </div>

      {!sales ? (
        <>
          <ListRowsSkeleton rows={limit} />
          <ListFooterSkeleton />
        </>
      ) : sales.length === 0 ? (
        <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <CircleCheckIcon className="size-4 text-success" />
          {empty}
        </p>
      ) : (
        <ul className="divide-y">
          {sales.slice(0, limit).map((s) => (
            <li key={s.id}>
              <Link
                to={saleHref(s.id)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.clientName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{detail(s)}</span>
                </span>
                <span className={`money font-bold ${tone}`}>{formatAudShort(amount(s))}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {sales && sales.length > 0 && (
        <Link
          to={seeAll}
          className="mt-auto flex items-center justify-center gap-1 border-t p-2.5 text-xs font-semibold text-primary hover:bg-muted/50"
        >
          See all {sales.length}
          <ArrowRightIcon className="size-3.5" />
        </Link>
      )}
    </section>
  )
}
