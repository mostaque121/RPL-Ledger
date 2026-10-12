/** What the viewer can show, hide and reorder on the Sales list (saved per browser, see `useViewItems`). */
import type { ViewItemDef } from '@/lib/view-prefs'
import type { SalesFilters } from './filters'

export type SaleColumnId =
  | 'date'
  | 'client'
  | 'course'
  | 'phone'
  | 'email'
  | 'seller'
  | 'rto'
  | 'source'
  | 'fee'
  | 'rtoCost'
  | 'referral'
  | 'collected'
  | 'due'
  | 'rtoDue'
  | 'hold'
  | 'profit'
  | 'net'
  | 'completed'
  | 'status'

export const SALE_COLUMNS: readonly ViewItemDef<SaleColumnId>[] = [
  { id: 'date', label: 'Date', defaultVisible: true },
  { id: 'client', label: 'Client', required: true, defaultVisible: true },
  { id: 'course', label: 'Course', defaultVisible: false },
  { id: 'phone', label: 'Phone', defaultVisible: false },
  { id: 'email', label: 'Email', defaultVisible: false },
  { id: 'seller', label: 'Seller', defaultVisible: true },
  { id: 'rto', label: 'RTO', defaultVisible: true },
  { id: 'source', label: 'Source', defaultVisible: false },
  { id: 'fee', label: 'Fee', defaultVisible: true },
  { id: 'rtoCost', label: 'RTO cost', defaultVisible: false },
  { id: 'referral', label: 'Referral', defaultVisible: false },
  { id: 'collected', label: 'Paid', defaultVisible: true },
  { id: 'due', label: 'Due', defaultVisible: true },
  { id: 'rtoDue', label: 'RTO due', defaultVisible: true },
  { id: 'hold', label: 'Hold', defaultVisible: true },
  { id: 'profit', label: 'Profit (before tax)', defaultVisible: false },
  { id: 'net', label: 'Net profit', defaultVisible: true },
  { id: 'completed', label: 'Completed on', defaultVisible: false },
  { id: 'status', label: 'Status', defaultVisible: true },
]

/** Filters that can be shown or hidden. Search and month are always there. */
export type SaleFilterId = 'seller' | 'rto' | 'course' | 'source' | 'payment' | 'state' | 'rtoPay'

export const SALE_FILTERS: readonly ViewItemDef<SaleFilterId>[] = [
  { id: 'seller', label: 'Seller', defaultVisible: true },
  { id: 'rto', label: 'RTO', defaultVisible: true },
  { id: 'course', label: 'Course', defaultVisible: false },
  { id: 'source', label: 'Source', defaultVisible: false },
  { id: 'payment', label: 'Client payment', defaultVisible: true },
  { id: 'state', label: 'State', defaultVisible: true },
  { id: 'rtoPay', label: 'RTO payment', defaultVisible: true },
]

/** The URL field each filter sets. */
export const FILTER_FIELD = {
  seller: 'sellerId',
  rto: 'rtoId',
  course: 'courseId',
  source: 'source',
  payment: 'payment',
  state: 'state',
  rtoPay: 'rtoPay',
} as const satisfies Record<SaleFilterId, keyof SalesFilters>

/** A hidden filter doesn't narrow the list, whatever the URL says. */
export function effectiveFilters(filters: SalesFilters, visible: readonly SaleFilterId[]): SalesFilters {
  const next = { ...filters }
  for (const id of Object.keys(FILTER_FIELD) as SaleFilterId[]) {
    if (!visible.includes(id)) next[FILTER_FIELD[id]] = 'all'
  }
  return next
}
