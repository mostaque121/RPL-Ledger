import { isMonthOrAll, oneOf, useUrlFilters } from '@/hooks/use-url-filters'
import { currentMonth } from '@/lib/format'
import type { ExpenseFilters } from '../filters'
import { EXPENSE_CATEGORIES, EXPENSE_SPLITS } from '../schema'

const defaults = (): ExpenseFilters => ({
  month: currentMonth(),
  category: 'all',
  split: 'all',
  employeeId: 'all',
  currency: 'all',
  search: '',
})

const validators = {
  month: isMonthOrAll,
  category: oneOf(['all', ...EXPENSE_CATEGORIES]),
  split: oneOf(['all', ...EXPENSE_SPLITS]),
  currency: oneOf(['all', 'AUD', 'BDT']),
}

/** Expense filters in the URL, e.g. `/expenses?month=2026-03&category=Salary`. */
export const useExpenseFilters = () => useUrlFilters(defaults, validators)
