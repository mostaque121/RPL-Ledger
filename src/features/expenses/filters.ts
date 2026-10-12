import { monthOf, type ExpenseSplit, type Month } from '@/lib/accounting'
import type { Currency, ExpenseCategory } from '@/types/db'
import type { Expense } from './api'

export type ExpenseFilters = {
  month: Month | 'all'
  category: ExpenseCategory | 'all'
  split: ExpenseSplit | 'all'
  employeeId: string | 'all'
  currency: Currency | 'all'
  search: string
}

export function filterExpenses(expenses: readonly Expense[], f: ExpenseFilters): Expense[] {
  const needle = f.search.trim().toLowerCase()
  return expenses.filter(
    (e) =>
      (f.month === 'all' || monthOf(e.spentOn) === f.month) &&
      (f.category === 'all' || e.category === f.category) &&
      (f.split === 'all' || e.split === f.split) &&
      (f.employeeId === 'all' || e.employeeId === f.employeeId) &&
      (f.currency === 'all' || e.currency === f.currency) &&
      (!needle ||
        [e.description, e.category, e.employeeName, e.saleClientName].some((v) => v?.toLowerCase().includes(needle))),
  )
}
