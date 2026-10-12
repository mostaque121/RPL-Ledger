import { SkeletonText } from '@/components/feedback/SkeletonText'
import { formatAudShort } from '@/lib/format'
import type { Cents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { SaleView } from '../../api/sales'
import { Panel } from './Panel'

const WARN = 'text-warning-foreground dark:text-warning'

interface MeterProps {
  label: string
  paid: Cents
  of: Cents
  bar: string
  /** e.g. "Due $1,200.00", or the "all paid" line. */
  footer: { text: string; tone?: string }
}

/** "$400 of $1,600" with a bar. The bar is display only; the figures come from `saleSummary`. */
function Meter({ label, paid, of, bar, footer }: MeterProps) {
  const pct = of > 0 ? Math.min(100, Math.max(0, (paid / of) * 100)) : paid > 0 ? 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">
          <span className="money font-bold text-foreground">{formatAudShort(paid)}</span> of <span className="money">{formatAudShort(of)}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="presentation">
        <div className={cn('h-full rounded-full transition-[width]', bar)} style={{ width: `${pct}%` }} />
      </div>
      <p className={cn('text-xs font-semibold', footer.tone ?? 'text-muted-foreground')}>{footer.text}</p>
    </div>
  )
}

function MeterSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold">{label}</span>
        <SkeletonText size="xs" className="w-28" />
      </div>
      <div className="h-2 rounded-full bg-muted" />
      <SkeletonText size="xs" className="w-24" />
    </div>
  )
}

/** The two meters while the sale loads. */
export function SaleBalanceSkeleton() {
  return (
    <Panel className="space-y-4">
      <MeterSkeleton label="Client paid" />
      <MeterSkeleton label="RTO paid" />
    </Panel>
  )
}

/** How far the client has paid, and how far the RTO has been paid. */
export function SaleBalance({ sale }: { sale: SaleView }) {
  const s = sale.summary

  if (sale.cancelled)
    return (
      <Panel className="text-sm text-muted-foreground">
        Cancelled: no profit, due or hold. Received so far: <span className="money font-semibold text-foreground">{formatAudShort(s.collected)}</span>
      </Panel>
    )

  const clientFooter =
    s.due > 0
      ? { text: `Due ${formatAudShort(s.due)}`, tone: WARN }
      : s.due < 0
        ? { text: `Overpaid by ${formatAudShort(-s.due)}`, tone: WARN }
        : { text: 'Paid in full', tone: 'text-success' }

  const rtoFooter =
    s.rtoDue > 0
      ? { text: `RTO due ${formatAudShort(s.rtoDue)}${s.hold > 0 ? ` · holding ${formatAudShort(s.hold)}` : ''}`, tone: s.hold > 0 ? WARN : 'text-danger' }
      : { text: 'RTO paid in full', tone: 'text-success' }

  return (
    <Panel className="space-y-4">
      <Meter label="Client paid" paid={s.collected} of={sale.courseFee} bar="bg-success" footer={clientFooter} />
      <Meter label="RTO paid" paid={s.rtoPaid} of={sale.rtoCost} bar="bg-danger" footer={rtoFooter} />
    </Panel>
  )
}
