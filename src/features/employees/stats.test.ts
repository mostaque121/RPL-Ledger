import { describe, expect, it } from 'vitest'
import type { Settings } from '@/lib/accounting'
import { toCents } from '@/lib/money'
import { withSummary, type Sale } from '@/features/sales/api/sales'
import { employeeHistory, employeeMonth, employeeOverview, employeePeriod, employeeTrend, owedBdt, type StatExpense } from './stats'

const settings: Settings = { taxPct: 20, tanvirShare: 60 }
const $ = toCents

function sale(id: string, o: Partial<Sale> = {}) {
  return withSummary(
    {
      id,
      saleDate: '2026-03-02',
      sellerId: 'reaz',
      sellerName: 'Reaz',
      seller: 'employee',
      clientName: `Client ${id}`,
      phone: null,
      email: null,
      courseId: null,
      courseName: null,
      rtoId: null,
      rtoName: null,
      courseFee: $(1600),
      rtoCost: $(550),
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
}

const commission = { id: 'x', spentOn: '2026-03-20', bdt: 500, aud: $(5.66) }
const sales = [
  sale('a', { completedOn: '2026-03-20', commission }), // net 840
  sale('b', { completedOn: '2026-04-05' }), // completed, commission owed
  sale('c', { saleDate: '2026-04-01' }), // open
  sale('d', { cancelled: true }),
  sale('e', { sellerId: 'mehedi', completedOn: '2026-03-10' }), // someone else
]

const expenses: StatExpense[] = [
  { employeeId: 'reaz', category: 'Salary', spentOn: '2026-03-31', bdt: 22000, amountAud: $(248.87) },
  { employeeId: 'reaz', category: 'Employee commission', spentOn: '2026-03-20', bdt: 500, amountAud: $(5.66) },
  { employeeId: 'mehedi', category: 'Salary', spentOn: '2026-03-31', bdt: 20000, amountAud: $(226.24) },
]

describe('employee stats', () => {
  it('one month: sales by sale date, completions, salary and commission paid', () => {
    expect(employeeMonth('reaz', '2026-03', sales, expenses)).toEqual({
      month: '2026-03',
      sales: 2, // a, b (d is cancelled)
      completed: 1,
      netProfit: $(840),
      salary: { count: 1, bdt: 22000, aud: $(248.87) },
      commission: { count: 1, bdt: 500, aud: $(5.66) },
      owed: 1, // b
      owedBdt: 0, // no pay rates given
    })
  })

  it('owed commission uses the rate on each sale’s completed date', () => {
    const rates = [
      { id: 'r1', effectiveFrom: '2026-01-01', salaryBdt: 22000, commissionPerSaleBdt: 500 },
      { id: 'r2', effectiveFrom: '2026-04-01', salaryBdt: 22000, commissionPerSaleBdt: 700 },
    ]
    expect(owedBdt([{ completedOn: '2026-03-20' }, { completedOn: '2026-04-05' }], rates)).toBe(500 + 700)
    expect(employeeMonth('reaz', '2026-03', sales, expenses, rates).owedBdt).toBe(700) // b, completed 05 Apr
  })

  it('history lists every active month, newest first', () => {
    const h = employeeHistory('reaz', sales, expenses)
    expect(h.map((m) => m.month)).toEqual(['2026-04', '2026-03'])
    expect(h[0]).toMatchObject({ sales: 1, completed: 1, netProfit: $(840), salary: { count: 0 } })
  })

  it('overview: counts, net profit, and completed sales still owed commission', () => {
    const o = employeeOverview('reaz', sales, expenses)
    expect(o).toMatchObject({ total: 4, open: 1, completed: 2, cancelled: 1, netProfit: $(1680) })
    expect(o.owed.map((s) => s.id)).toEqual(['b'])
    expect(o.commissionPaid).toEqual({ count: 1, bdt: 500, aud: $(5.66) })
    expect(o.salaryPaid.bdt).toBe(22000)
  })

  it('period: sold, completed, partner share, payments and what is left after pay', () => {
    const march = employeePeriod('reaz', '2026-03', sales, expenses, settings)
    expect(march.sold.map((s) => s.id)).toEqual(['a', 'b', 'd']) // cancelled d still listed
    expect(march.completed.map((s) => s.id)).toEqual(['a'])
    expect(march.netProfit).toBe($(840))
    expect(march.share).toEqual({ tanvir: $(504), md: $(336) })
    expect(march.payments.map((e) => e.category)).toEqual(['Salary', 'Employee commission']) // newest first
    expect(march.pay).toBe($(248.87) + $(5.66))
    expect(march.afterPay).toBe($(840) - $(248.87) - $(5.66))

    const all = employeePeriod('reaz', 'all', sales, expenses, settings)
    expect(all.sold).toHaveLength(4)
    expect(all.completed).toHaveLength(2)
    expect(all.share.tanvir + all.share.md).toBe(all.netProfit)
  })

  it('trend: a fixed run of months ending at the picked one, empty months included', () => {
    const t = employeeTrend('reaz', '2026-04', sales, expenses, 3)
    expect(t.map((m) => m.month)).toEqual(['2026-02', '2026-03', '2026-04'])
    expect(t[0]).toMatchObject({ sales: 0, completed: 0, pay: 0 })
    expect(t[1].pay).toBe($(248.87) + $(5.66))
    expect(t[2]).toMatchObject({ completed: 1, netProfit: $(840) })
  })
})
