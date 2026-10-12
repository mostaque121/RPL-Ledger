import { describe, expect, it } from 'vitest'
import type { Expense } from '@/features/expenses/api'
import { withSummary, type Sale } from '@/features/sales/api/sales'
import { monthlyStatementDetail, profitView, type Settings } from '@/lib/accounting'
import { toCents } from '@/lib/money'
import { statementSheets } from './export'
import { statementLines } from './lines'

const settings: Settings = { taxPct: 20, tanvirShare: 60 }
const $ = toCents

const sale = (id: string, o: Partial<Sale>) =>
  withSummary(
    {
      id,
      saleDate: '2026-03-01',
      sellerId: 'x',
      sellerName: 'Tanvir',
      seller: 'tanvir',
      clientName: `Client ${id}`,
      phone: null,
      email: null,
      courseId: null,
      courseName: null,
      rtoId: null,
      rtoName: 'ACMC',
      courseFee: 0,
      rtoCost: 0,
      referralCommission: 0,
      source: 'Website',
      docsLink: null,
      notes: null,
      completedOn: null,
      cancelled: false,
      payments: [],
      rtoPayments: [],
      commission: null,
      ...o,
    },
    settings,
  )

const expense = (id: string, amount: number, split: Expense['split']): Expense => ({
  id,
  spentOn: '2026-03-03',
  category: 'Ads',
  description: null,
  amountAud: $(amount),
  currency: 'AUD',
  bdt: null,
  fxRate: null,
  employeeId: null,
  employeeName: null,
  saleId: null,
  saleClientName: null,
  split,
})

const sales = [
  sale('a', {
    courseFee: $(1800),
    rtoCost: $(1000),
    completedOn: '2026-03-20',
    payments: [
      { id: 'p1', paidOn: '2026-02-10', amount: $(500), note: null },
      { id: 'p2', paidOn: '2026-03-10', amount: $(1300), note: null },
    ],
    rtoPayments: [{ id: 'r1', paidOn: '2026-03-15', amount: $(1000), note: null, agency: 'OS' }],
  }),
  sale('b', {
    seller: 'employee',
    sellerName: 'Reaz',
    courseFee: $(1600),
    rtoCost: $(550),
    completedOn: '2026-03-25',
  }),
]
const expenses = [expense('e1', 1000, 'shared'), expense('e2', 100, 'tanvir')]

describe('statementLines', () => {
  const detail = monthlyStatementDetail('tanvir', '2026-03', sales, expenses, settings)
  const lines = statementLines(detail, settings)

  it('signs each line and ends on the take-home', () => {
    expect(lines.map((l) => [l.key, l.amount])).toEqual([
      ['cashIn', $(1300)],
      ['rtoPaid', $(-1000)],
      ['hold', $(500)], // last month's 500 released
      ['tax', $(-160)],
      ['expenses', $(-700)],
      ['employee', $(504)],
    ])
    expect(lines.at(-1)!.balance).toBe(detail.statement.takeHome)
    expect(detail.statement.takeHome).toBe($(444))
  })

  it("each line's rows add up to the line", () => {
    for (const line of lines) {
      expect(line.rows.reduce((sum, r) => sum + r.amount, 0)).toBe(line.amount)
    }
  })
})

describe('statementSheets', () => {
  it('summary and detail sheets carry the same take-home', () => {
    const lines = statementLines(monthlyStatementDetail('tanvir', '2026-03', sales, expenses, settings), settings)
    const sheets = statementSheets(
      '2026-03',
      [{ name: 'Tanvir', lines, takeHome: $(444) }],
      profitView('2026-03', sales, expenses, settings),
    )
    expect(sheets.map((s) => s.name)).toEqual(['Summary', 'Tanvir detail'])
    expect(sheets[0].rows.find((r) => r[0] === 'Take-home')).toEqual(['Take-home', 444])
    expect(sheets[1].rows.at(-1)).toEqual(['Take-home', null, null, null, 444])
    expect(sheets[1].rows).toContainEqual(['Client payments received', '10 Mar 2026', 'Client a', 'ACMC', 1300])
  })
})
