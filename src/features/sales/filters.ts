import { monthOf, type Month, type PaymentStatus } from '@/lib/accounting'
import type { SaleSource } from '@/types/db'
import type { SaleView } from './api/sales'

/** `due` = anything still owed (Partial or Unpaid). */
export type PaymentFilter = 'all' | 'due' | PaymentStatus
export type StateFilter = 'all' | 'open' | 'completed' | 'cancelled'
/** The list's tabs: every sale, Tanvir's own (he is the only user), or everyone else's. */
export type OwnerFilter = 'all' | 'mine' | 'others'

export type SalesFilters = {
  owner: OwnerFilter
  /** Month of the sale date, or `all`. */
  month: Month | 'all'
  sellerId: string | 'all'
  rtoId: string | 'all'
  courseId: string | 'all'
  source: SaleSource | 'all'
  payment: PaymentFilter
  state: StateFilter
  /** `due` = the RTO is still owed money. */
  rtoPay: 'all' | 'due'
  search: string
}

export const saleState = (s: Pick<SaleView, 'cancelled' | 'completedOn'>): Exclude<StateFilter, 'all'> =>
  s.cancelled ? 'cancelled' : s.completedOn ? 'completed' : 'open'

function matchesPayment(sale: SaleView, filter: PaymentFilter) {
  if (filter === 'all') return true
  if (sale.cancelled) return false // a cancelled sale owes nothing, but isn't "Paid" either
  if (filter === 'due') return sale.summary.due > 0
  return sale.summary.status === filter
}

function matchesSearch(sale: SaleView, needle: string) {
  if (!needle) return true
  return [sale.clientName, sale.phone, sale.email, sale.courseName, sale.rtoName, sale.sellerName, sale.notes].some(
    (field) => field?.toLowerCase().includes(needle),
  )
}

export function filterSales(sales: readonly SaleView[], f: SalesFilters): SaleView[] {
  const needle = f.search.trim().toLowerCase()
  return sales.filter(
    (s) =>
      (f.owner === 'all' || (s.seller === 'tanvir') === (f.owner === 'mine')) &&
      (f.month === 'all' || monthOf(s.saleDate) === f.month) &&
      (f.sellerId === 'all' || s.sellerId === f.sellerId) &&
      (f.rtoId === 'all' || s.rtoId === f.rtoId) &&
      (f.courseId === 'all' || s.courseId === f.courseId) &&
      (f.source === 'all' || s.source === f.source) &&
      (f.state === 'all' || saleState(s) === f.state) &&
      (f.rtoPay === 'all' || (!s.cancelled && s.summary.rtoDue > 0)) &&
      matchesPayment(s, f.payment) &&
      matchesSearch(s, needle),
  )
}
