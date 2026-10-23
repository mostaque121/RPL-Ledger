import { monthOf, type Month, type PaymentStatus } from '@/lib/accounting'
import type { SaleSource } from '@/types/db'
import type { SaleView } from './api/sales'

/** `due` = anything still owed (Partial or Unpaid). */
export type PaymentFilter = 'all' | 'due' | PaymentStatus
/** `refunded` = cancelled, with money given back to the client (a negative payment). */
export type StateFilter = 'all' | 'open' | 'completed' | 'cancelled' | 'refunded'
/**
 * The list's tabs: every sale, Tanvir's own (he is the only user), everyone else's, or
 * `rtoDue` = any seller's sale the RTO is still owed money for (a quick lookup).
 */
export type OwnerFilter = 'all' | 'mine' | 'others' | 'rtoDue'

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

export const isRefunded = (s: Pick<SaleView, 'cancelled' | 'payments'>) => s.cancelled && s.payments.some((p) => p.amount < 0)

export const saleState = (s: Pick<SaleView, 'cancelled' | 'completedOn' | 'payments'>): Exclude<StateFilter, 'all'> =>
  isRefunded(s) ? 'refunded' : s.cancelled ? 'cancelled' : s.completedOn ? 'completed' : 'open'

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

const rtoOwed = (s: SaleView) => !s.cancelled && s.summary.rtoDue > 0

function matchesOwner(sale: SaleView, owner: OwnerFilter) {
  if (owner === 'all') return true
  if (owner === 'rtoDue') return rtoOwed(sale)
  return (sale.seller === 'tanvir') === (owner === 'mine')
}

export function filterSales(sales: readonly SaleView[], f: SalesFilters): SaleView[] {
  const needle = f.search.trim().toLowerCase()
  return sales.filter(
    (s) =>
      matchesOwner(s, f.owner) &&
      (f.month === 'all' || monthOf(s.saleDate) === f.month) &&
      (f.sellerId === 'all' || s.sellerId === f.sellerId) &&
      (f.rtoId === 'all' || s.rtoId === f.rtoId) &&
      (f.courseId === 'all' || s.courseId === f.courseId) &&
      (f.source === 'all' || s.source === f.source) &&
      (f.state === 'all' || saleState(s) === f.state) &&
      (f.rtoPay === 'all' || rtoOwed(s)) &&
      matchesPayment(s, f.payment) &&
      matchesSearch(s, needle),
  )
}
