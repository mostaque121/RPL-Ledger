import { pickWidth } from '@/components/feedback/skeleton-widths'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { profitSplit, type Settings } from '@/lib/accounting'
import { formatAudShort, formatMonth } from '@/lib/format'
import type { Cents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { SaleView } from '../../api/sales'

interface Row {
  label: string
  value: Cents
  tone?: string
  strong?: boolean
}

function Block({ title, rows, footer }: { title: string; rows: Row[]; footer?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{title}</p>
      <dl className="mt-2 space-y-1 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-2">
            <dt className={cn('text-muted-foreground', r.strong && 'font-semibold text-foreground')}>{r.label}</dt>
            <dd className={cn('money', r.strong && 'font-bold', r.tone)}>{formatAudShort(r.value)}</dd>
          </div>
        ))}
      </dl>
      {footer && <p className="mt-2 text-xs text-muted-foreground">{footer}</p>}
    </div>
  )
}

interface SkeletonRow {
  /** Null when the label depends on the sale too (the profit rows). */
  label: string | null
  strong?: boolean
}

function BlockSkeleton({ title, rows, footer }: { title: string; rows: SkeletonRow[]; footer?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{title}</p>
      <dl className="mt-2 space-y-1 text-sm">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            {r.label ? (
              <dt className={cn('text-muted-foreground', r.strong && 'font-semibold text-foreground')}>{r.label}</dt>
            ) : (
              <SkeletonText className={pickWidth(['w-14', 'w-16', 'w-20'], i)} />
            )}
            <SkeletonText className={pickWidth(['w-16', 'w-14', 'w-12'], i)} />
          </div>
        ))}
      </dl>
      {footer && <SkeletonText size="xs" className="mt-2 w-36" />}
    </div>
  )
}

/** The three money blocks while the sale loads. */
export function SaleMoneySummarySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <BlockSkeleton title="Client" rows={[{ label: 'Course fee' }, { label: 'Received' }, { label: 'Due', strong: true }]} />
      <BlockSkeleton
        title="RTO"
        rows={[{ label: 'RTO cost' }, { label: 'Paid to RTO' }, { label: 'RTO due', strong: true }, { label: 'Hold' }]}
      />
      <BlockSkeleton title="Profit" rows={[{ label: null }, { label: null }, { label: null }, { label: null }]} footer />
    </div>
  )
}

const WARN = 'text-warning-foreground dark:text-warning'

/** Client, RTO and profit figures for one sale, all from `saleSummary`. */
export function SaleMoneySummary({ sale, settings }: { sale: SaleView; settings: Settings }) {
  const s = sale.summary
  const split = profitSplit(sale.seller, s.netProfit, settings)

  const client: Row[] = [
    { label: 'Course fee', value: sale.cancelled ? 0 : sale.courseFee },
    { label: 'Received', value: s.collected, tone: 'text-success' },
    s.due < 0
      ? { label: 'Overpaid', value: -s.due, tone: WARN, strong: true }
      : { label: 'Due', value: s.due, tone: s.due > 0 ? WARN : undefined, strong: true },
  ]

  const rto: Row[] = [
    { label: 'RTO cost', value: sale.cancelled ? 0 : sale.rtoCost },
    { label: 'Paid to RTO', value: s.rtoPaid, tone: 'text-danger' },
    { label: 'RTO due', value: s.rtoDue, tone: s.rtoDue > 0 ? 'text-danger' : undefined, strong: true },
    { label: 'Hold', value: s.hold, tone: s.hold > 0 ? WARN : undefined },
  ]

  const profit: Row[] = sale.cancelled
    ? [{ label: 'Profit', value: 0 }]
    : [
        ...(sale.referralCommission ? [{ label: 'Referral', value: -sale.referralCommission, tone: 'text-danger' }] : []),
        { label: 'Profit', value: s.profit },
        { label: `Tax ${settings.taxPct}%`, value: -s.tax, tone: 'text-danger' },
        { label: 'Net profit', value: s.netProfit, tone: s.netProfit < 0 ? 'text-danger' : 'text-success', strong: true },
        ...(split.tanvir ? [{ label: '→ Tanvir', value: split.tanvir }] : []),
        ...(split.md ? [{ label: '→ MD', value: split.md }] : []),
      ]

  const profitFooter = sale.cancelled
    ? 'Cancelled: no profit, due or hold.'
    : s.profitMonth
      ? `Counts in ${formatMonth(s.profitMonth)}.`
      : 'Not completed yet, so no profit is counted.'

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Block title="Client" rows={client} />
      <Block title="RTO" rows={rto} footer={s.hold > 0 ? 'Hold: client money that still belongs to the RTO.' : undefined} />
      <Block title="Profit" rows={profit} footer={profitFooter} />
    </div>
  )
}
