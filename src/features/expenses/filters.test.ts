import { describe, expect, it } from 'vitest'
import { toCents } from '@/lib/money'
import type { Expense } from './api'
import { filterExpenses, type ExpenseFilters } from './filters'

const ALL: ExpenseFilters = { month: 'all', category: 'all', split: 'all', employeeId: 'all', currency: 'all', search: '' }

const expense = (id: string, o: Partial<Expense> = {}): Expense => ({
  id,
  spentOn: '2026-03-05',
  category: 'Ads',
  description: null,
  amountAud: toCents(100),
  currency: 'AUD',
  bdt: null,
  fxRate: null,
  employeeId: null,
  employeeName: null,
  saleId: null,
  saleClientName: null,
  split: 'shared',
  ...o,
})

const list = [
  expense('a', { description: 'Meta ads' }),
  expense('b', { spentOn: '2026-04-01', category: 'Software', description: 'HubSpot', split: 'tanvir' }),
  expense('c', { category: 'Salary', employeeId: 'reaz', employeeName: 'Reaz', currency: 'BDT', bdt: 22000, fxRate: 88.4 }),
  expense('d', { category: 'Employee commission', employeeId: 'reaz', employeeName: 'Reaz', saleClientName: 'Jane Doe' }),
]
const ids = (f: Partial<ExpenseFilters>) => filterExpenses(list, { ...ALL, ...f }).map((e) => e.id)

describe('filterExpenses', () => {
  it('filters by month, category, split and employee', () => {
    expect(ids({ month: '2026-03' })).toEqual(['a', 'c', 'd'])
    expect(ids({ category: 'Salary' })).toEqual(['c'])
    expect(ids({ split: 'tanvir' })).toEqual(['b'])
    expect(ids({ employeeId: 'reaz' })).toEqual(['c', 'd'])
  })

  it('searches description, category, employee and sale client', () => {
    expect(ids({ search: 'hubspot' })).toEqual(['b'])
    expect(ids({ search: 'reaz' })).toEqual(['c', 'd'])
    expect(ids({ search: 'jane' })).toEqual(['d'])
    expect(ids({ search: 'salary' })).toEqual(['c'])
  })

  it('filters by currency', () => {
    expect(ids({ currency: 'BDT' })).toEqual(['c'])
  })
})
