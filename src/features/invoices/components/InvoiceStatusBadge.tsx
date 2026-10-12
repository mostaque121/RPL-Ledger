import { StatusBadge, type StatusTone } from '@/components/feedback/StatusBadge'
import type { InvoiceStatus } from '../filters'

const TONE: Record<InvoiceStatus, StatusTone> = { Paid: 'success', Due: 'warning', Overdue: 'danger' }

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <StatusBadge tone={TONE[status]}>{status}</StatusBadge>
}

/** `v3` — shown only once an invoice has been updated. */
export function VersionBadge({ version, className }: { version: number; className?: string }) {
  if (version < 2) return null
  return (
    <StatusBadge tone="info" className={className}>
      v{version}
    </StatusBadge>
  )
}
