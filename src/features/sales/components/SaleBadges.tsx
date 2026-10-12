import { StatusBadge, type StatusTone } from '@/components/feedback/StatusBadge'
import type { PaymentStatus } from '@/lib/accounting'
import type { SaleView } from '../api/sales'

const PAYMENT_TONE: Record<PaymentStatus, StatusTone> = { Paid: 'success', Partial: 'warning', Unpaid: 'danger' }

/** Payment status, plus Completed / Cancelled. A cancelled sale shows only "Cancelled". */
export function SaleBadges({ sale }: { sale: Pick<SaleView, 'cancelled' | 'completedOn' | 'summary'> }) {
  if (sale.cancelled) return <StatusBadge tone="muted">Cancelled</StatusBadge>
  return (
    <span className="inline-flex flex-wrap gap-1">
      <StatusBadge tone={PAYMENT_TONE[sale.summary.status]}>{sale.summary.status}</StatusBadge>
      {sale.completedOn && <StatusBadge tone="info">Completed</StatusBadge>}
    </span>
  )
}
