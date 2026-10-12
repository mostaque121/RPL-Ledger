/** What the viewer can show, hide and reorder on the Expenses page (saved per browser, see `useViewItems`). */
import type { ViewItemDef } from '@/lib/view-prefs'
import type { ExpenseFilters } from './filters'

export type ExpenseColumnId = 'date' | 'category' | 'details' | 'employee' | 'sale' | 'amount' | 'split' | 'tanvir' | 'md'

export const EXPENSE_COLUMNS: readonly ViewItemDef<ExpenseColumnId>[] = [
  { id: 'date', label: 'Date', defaultVisible: true },
  { id: 'category', label: 'Category', defaultVisible: true },
  { id: 'details', label: 'Details', required: true, defaultVisible: true },
  { id: 'employee', label: 'Employee', defaultVisible: false },
  { id: 'sale', label: 'Sale (client)', defaultVisible: false },
  { id: 'amount', label: 'Amount', defaultVisible: true },
  { id: 'split', label: 'Split', defaultVisible: true },
  { id: 'tanvir', label: "Tanvir's share", defaultVisible: true },
  { id: 'md', label: "MD's share", defaultVisible: true },
]

/** Filters that can be shown or hidden. Search and month are always there. */
export type ExpenseFilterId = 'category' | 'split' | 'employee' | 'currency'

export const EXPENSE_FILTERS: readonly ViewItemDef<ExpenseFilterId>[] = [
  { id: 'category', label: 'Category', defaultVisible: true },
  { id: 'split', label: 'Split', defaultVisible: true },
  { id: 'employee', label: 'Employee', defaultVisible: true },
  { id: 'currency', label: 'Currency (AUD / BDT)', defaultVisible: false },
]

/** The URL field each filter sets. */
export const EXPENSE_FILTER_FIELD = {
  category: 'category',
  split: 'split',
  employee: 'employeeId',
  currency: 'currency',
} as const satisfies Record<ExpenseFilterId, keyof ExpenseFilters>

/** A hidden filter doesn't narrow the list, whatever the URL says. */
export function effectiveExpenseFilters(filters: ExpenseFilters, visible: readonly ExpenseFilterId[]): ExpenseFilters {
  const next = { ...filters }
  for (const id of Object.keys(EXPENSE_FILTER_FIELD) as ExpenseFilterId[]) {
    if (!visible.includes(id)) next[EXPENSE_FILTER_FIELD[id]] = 'all'
  }
  return next
}
