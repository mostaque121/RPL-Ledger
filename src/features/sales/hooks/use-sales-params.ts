import { isMonthOrAll, oneOf, useUrlFilters } from '@/hooks/use-url-filters'
import { currentMonth } from '@/lib/format'
import type { SalesFilters } from '../filters'
import { SALE_SOURCES } from '../schema'

const defaults = (): SalesFilters => ({
  owner: 'all',
  month: currentMonth(),
  sellerId: 'all',
  rtoId: 'all',
  courseId: 'all',
  source: 'all',
  payment: 'all',
  state: 'all',
  rtoPay: 'all',
  search: '',
})

const validators = {
  owner: oneOf(['all', 'mine', 'others', 'rtoDue']),
  month: isMonthOrAll,
  payment: oneOf(['all', 'due', 'Paid', 'Partial', 'Unpaid']),
  state: oneOf(['all', 'open', 'completed', 'cancelled', 'refunded']),
  rtoPay: oneOf(['all', 'due']),
  source: oneOf(['all', ...SALE_SOURCES]),
}

/**
 * Sales filters live in the URL (`?month=all&payment=due`). A sale opens on its own page (`/sales/<id>`).
 * The month defaults to the current month; `month=all` shows every month.
 */
export function useSalesParams() {
  return useUrlFilters(defaults, validators)
}
