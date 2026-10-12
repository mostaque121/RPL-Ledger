import { describe, expect, it } from 'vitest'
import {
  bdtToAud,
  companyMonth,
  profitByGroup,
  sumBdtAsAud,
  expenseTotals,
  expensesSplit,
  fullyPaidOn,
  invoiceTotals,
  monthlyStatement,
  monthlyStatementDetail,
  previousMonth,
  profitSplit,
  profitView,
  saleProfit,
  saleSummary,
  salesTotals,
  type ExpenseInput,
  type SaleInput,
  type Settings,
} from './accounting'
import { splitByPercent, toCents } from './money'

const settings: Settings = { taxPct: 20, tanvirShare: 60 }
const $ = toCents

function sale(overrides: Partial<SaleInput> = {}): SaleInput {
  return {
    saleDate: '2026-03-02',
    seller: 'tanvir',
    courseFee: 0,
    rtoCost: 0,
    referralCommission: 0,
    completedOn: null,
    cancelled: false,
    payments: [],
    rtoPayments: [],
    ...overrides,
  }
}

describe('CLAUDE.md test cases', () => {
  it('1. Tanvir sale: fee 2500, RTO 1600 → profit 900, tax 180, net 720', () => {
    expect(saleProfit({ courseFee: $(2500), rtoCost: $(1600), referralCommission: 0 }, settings)).toEqual({
      profit: $(900),
      tax: $(180),
      netProfit: $(720),
    })
    expect(profitSplit('tanvir', $(720), settings)).toEqual({ tanvir: $(720), md: 0 })
  })

  it('2. Employee sale: fee 1600, RTO 550 → profit 1050, tax 210, net 840 → Tanvir 504, MD 336', () => {
    const p = saleProfit({ courseFee: $(1600), rtoCost: $(550), referralCommission: 0 }, settings)
    expect(p).toEqual({ profit: $(1050), tax: $(210), netProfit: $(840) })
    expect(profitSplit('employee', p.netProfit, settings)).toEqual({ tanvir: $(504), md: $(336) })
  })

  it('3. Shared expenses totalling 1940 → Tanvir 1164, MD 776', () => {
    const expenses: ExpenseInput[] = [
      { spentOn: '2026-03-01', amountAud: $(1200), split: 'shared' },
      { spentOn: '2026-03-10', amountAud: $(540), split: 'shared' },
      { spentOn: '2026-03-20', amountAud: $(200), split: 'shared' },
    ]
    expect(expensesSplit(expenses, settings)).toEqual({ tanvir: $(1164), md: $(776) })
  })

  it('4. BDT salary 22,000 at 88.4 → 248.87 AUD', () => {
    expect(bdtToAud(22000, 88.4)).toBe($(248.87))
  })

  it('5. Hold follows collections and RTO payments', () => {
    const base = sale({ courseFee: $(1800), rtoCost: $(1000) })
    const s1 = { ...base, payments: [{ paidOn: '2026-03-01', amount: $(500) }] }
    expect(saleSummary(s1, settings).hold).toBe($(500))

    const s2 = { ...s1, payments: [...s1.payments, { paidOn: '2026-03-05', amount: $(1300) }] }
    expect(saleSummary(s2, settings).hold).toBe($(1000))

    const s3 = { ...s2, rtoPayments: [{ paidOn: '2026-03-08', amount: $(1000) }] }
    expect(saleSummary(s3, settings).hold).toBe(0)
  })

  it('6. Instalments 400 + 600 + 600 on 1600 → Paid, fully paid on the 3rd payment date', () => {
    const s = sale({
      courseFee: $(1600),
      payments: [
        { paidOn: '2026-01-10', amount: $(400) },
        { paidOn: '2026-02-10', amount: $(600) },
        { paidOn: '2026-03-10', amount: $(600) },
      ],
    })
    const sum = saleSummary(s, settings)
    expect(sum.status).toBe('Paid')
    expect(sum.due).toBe(0)
    expect(sum.fullyPaidOn).toBe('2026-03-10')
  })
})

describe('sale summary', () => {
  it('status is Unpaid / Partial / Paid', () => {
    const s = sale({ courseFee: $(1000) })
    expect(saleSummary(s, settings).status).toBe('Unpaid')
    expect(saleSummary({ ...s, payments: [{ paidOn: '2026-03-01', amount: $(1) }] }, settings).status).toBe('Partial')
    expect(saleSummary({ ...s, payments: [{ paidOn: '2026-03-01', amount: $(1200) }] }, settings).status).toBe('Paid')
  })

  it('a refund that drops below the fee clears fully_paid_on', () => {
    expect(
      fullyPaidOn($(1000), [
        { paidOn: '2026-03-01', amount: $(1000) },
        { paidOn: '2026-03-09', amount: $(-200) },
      ]),
    ).toBeNull()
  })

  it('payments are sorted by date before finding fully_paid_on', () => {
    expect(
      fullyPaidOn($(1000), [
        { paidOn: '2026-03-20', amount: $(500) },
        { paidOn: '2026-03-01', amount: $(500) },
      ]),
    ).toBe('2026-03-20')
  })

  it('asOfMonth ignores later payments', () => {
    const s = sale({
      courseFee: $(1800),
      rtoCost: $(1000),
      payments: [
        { paidOn: '2026-02-15', amount: $(500) },
        { paidOn: '2026-03-15', amount: $(1300) },
      ],
    })
    expect(saleSummary(s, settings, '2026-02').hold).toBe($(500))
    expect(saleSummary(s, settings, '2026-03').hold).toBe($(1000))
  })

  it('a cancelled sale has no profit, due or hold', () => {
    const s = sale({
      courseFee: $(1000),
      rtoCost: $(500),
      cancelled: true,
      payments: [{ paidOn: '2026-03-01', amount: $(300) }],
    })
    const sum = saleSummary(s, settings)
    expect(sum).toMatchObject({ profit: 0, tax: 0, netProfit: 0, due: 0, hold: 0, rtoDue: 0, collected: $(300) })
  })

  it('completion is only recognised from its month onward', () => {
    const s = sale({ completedOn: '2026-04-02' })
    expect(saleSummary(s, settings, '2026-03').isCompleted).toBe(false)
    expect(saleSummary(s, settings, '2026-04').profitMonth).toBe('2026-04')
  })
})

describe('rounding', () => {
  it('splits always add up to the total', () => {
    for (const cents of [1, 3, 7, 101, 99999, 123457]) {
      const [a, b] = splitByPercent(cents, 60)
      expect(a + b).toBe(cents)
    }
  })

  it('handles float-noise amounts', () => {
    expect(toCents(1.005)).toBe(101)
    expect(toCents('0.1') + toCents('0.2')).toBe(toCents('0.3'))
    expect(toCents(-2.5)).toBe(-250)
  })

  it('previousMonth rolls over the year', () => {
    expect(previousMonth('2026-01')).toBe('2025-12')
    expect(previousMonth('2026-10')).toBe('2026-09')
  })
})

describe('monthly statement & profit view', () => {
  // March 2026: a Tanvir sale paid in two months and completed in March,
  // an employee sale completed in March, an MD sale, and some expenses.
  const sales: SaleInput[] = [
    sale({
      seller: 'tanvir',
      courseFee: $(1800),
      rtoCost: $(1000),
      completedOn: '2026-03-20',
      payments: [
        { paidOn: '2026-02-10', amount: $(500) }, // Feb hold 500
        { paidOn: '2026-03-10', amount: $(1300) },
      ],
      rtoPayments: [{ paidOn: '2026-03-15', amount: $(1000) }], // Mar hold 0
    }),
    sale({
      seller: 'employee',
      courseFee: $(1600),
      rtoCost: $(550),
      completedOn: '2026-03-25',
      payments: [{ paidOn: '2026-03-01', amount: $(1600) }],
      rtoPayments: [{ paidOn: '2026-03-02', amount: $(550) }],
    }),
    sale({
      seller: 'md',
      courseFee: $(2000),
      rtoCost: $(1200),
      payments: [{ paidOn: '2026-03-05', amount: $(800) }], // not completed, hold 800
    }),
  ]
  const expenses: ExpenseInput[] = [
    { spentOn: '2026-03-03', amountAud: $(1000), split: 'shared' },
    { spentOn: '2026-03-04', amountAud: $(100), split: 'tanvir' },
    { spentOn: '2026-02-28', amountAud: $(999), split: 'shared' }, // other month
  ]

  it('statement detail: the rows behind each line add up to it', () => {
    const d = monthlyStatementDetail('tanvir', '2026-03', sales, expenses, settings)
    const [tanvirSale, employeeSale] = sales
    expect(d.cashIn).toEqual([{ sale: tanvirSale, paidOn: '2026-03-10', amount: $(1300) }])
    expect(d.rtoPaid).toEqual([{ sale: tanvirSale, paidOn: '2026-03-15', amount: $(1000) }])
    expect(d.hold).toEqual([{ sale: tanvirSale, start: $(500), end: 0, change: $(-500) }])
    expect(d.tax).toEqual([{ sale: tanvirSale, profit: $(800), tax: $(160) }])
    expect(d.expenses.map((r) => r.share)).toEqual([$(600), $(100)]) // February's expense left out
    expect(d.employee).toEqual([{ sale: employeeSale, netProfit: $(840), share: $(504) }])
    expect(d.statement).toEqual(monthlyStatement('tanvir', '2026-03', sales, expenses, settings))
  })

  it('statement detail leaves out expenses the partner pays nothing of', () => {
    const d = monthlyStatementDetail('md', '2026-03', sales, expenses, settings)
    expect(d.expenses.map((r) => r.share)).toEqual([$(400)]) // the Tanvir-only expense is skipped
    expect(d.hold).toEqual([{ sale: sales[2], start: 0, end: $(800), change: $(800) }])
  })

  it('company month for March: cash, RTO paid, profit, dues and hold at month end', () => {
    expect(companyMonth('2026-03', sales, expenses, settings)).toEqual({
      month: '2026-03',
      cashIn: $(1300 + 1600 + 800),
      rtoPaid: $(1000 + 550),
      expenses: $(1100),
      salesProfit: $(1850),
      companyProfit: $(750),
      dues: $(1200), // MD's sale: 2000 − 800
      hold: $(800), // MD's sale: 800 collected, RTO unpaid
      takeHome: { tanvir: $(444), md: $(-64) },
    })
  })

  it('company month for February only counts what had happened by then', () => {
    const feb = companyMonth('2026-02', sales, expenses, settings)
    // The sales are dated in March, so nothing is owed yet; the early 500 is already held.
    expect(feb).toMatchObject({ cashIn: $(500), rtoPaid: 0, expenses: $(999), dues: 0, hold: $(500) })
  })

  it('profit by group: completed sales in the range, biggest first', () => {
    const groups = profitByGroup(sales, (s) => s.seller, '2026-03', '2026-03', settings)
    expect(groups).toEqual([
      { key: 'employee', count: 1, profit: $(1050), netProfit: $(840) },
      { key: 'tanvir', count: 1, profit: $(800), netProfit: $(640) },
    ])
    expect(profitByGroup(sales, (s) => s.seller, '2026-04', '2026-12', settings)).toEqual([])
  })

  it('Tanvir take-home for March', () => {
    const st = monthlyStatement('tanvir', '2026-03', sales, expenses, settings)
    expect(st).toMatchObject({
      cashIn: $(1300),
      rtoPaid: $(1000),
      holdStart: $(500),
      holdEnd: 0,
      holdChange: $(-500),
      tax: $(160), // 20% of profit 800
      expenseShare: $(700), // 600 shared + 100 own
      employeeShare: $(504),
    })
    // 1300 − 1000 + 500 − 160 − 700 + 504
    expect(st.takeHome).toBe($(444))
  })

  it('MD take-home for March (uncompleted sale: no tax yet, cash held)', () => {
    const st = monthlyStatement('md', '2026-03', sales, expenses, settings)
    expect(st).toMatchObject({
      cashIn: $(800),
      rtoPaid: 0,
      holdStart: 0,
      holdEnd: $(800),
      tax: 0,
      expenseShare: $(400),
      employeeShare: $(336),
    })
    // 800 − 0 − 800 − 0 − 400 + 336
    expect(st.takeHome).toBe($(-64))
  })

  it('profit view for March', () => {
    const pv = profitView('2026-03', sales, expenses, settings)
    expect(pv.salesProfit).toBe($(800 + 1050))
    expect(pv.expenses).toBe($(1100))
    expect(pv.companyProfit).toBe($(750))
    // Tanvir: net 640 + employee 504 − expenses 700 = 444
    // MD:     net 0   + employee 336 − expenses 400 = −64
    expect(pv.partnerProfit).toEqual({ tanvir: $(444), md: $(-64) })
  })
})

describe('salesTotals', () => {
  const row = (s: SaleInput) => ({
    courseFee: s.courseFee,
    rtoCost: s.rtoCost,
    referralCommission: s.referralCommission,
    cancelled: s.cancelled,
    summary: saleSummary(s, settings),
  })

  it('sums open sales and ignores overpayments in the due total', () => {
    const a = sale({ courseFee: $(1000), rtoCost: $(400), payments: [{ paidOn: '2026-03-01', amount: $(300) }] })
    const b = sale({ courseFee: $(500), rtoCost: $(100), payments: [{ paidOn: '2026-03-01', amount: $(600) }] })
    expect(salesTotals([row(a), row(b)])).toEqual({
      courseFee: $(1500),
      rtoCost: $(500),
      referralCommission: 0,
      collected: $(900),
      due: $(700), // b is overpaid by 100, which doesn't reduce a's due
      rtoDue: $(500),
      hold: $(300 + 100),
      profit: $(600 + 400),
      netProfit: $(480 + 320),
    })
  })

  it('cancelled sales add only their cash', () => {
    const c = sale({ courseFee: $(1000), cancelled: true, payments: [{ paidOn: '2026-03-01', amount: $(200) }] })
    expect(salesTotals([row(c)])).toEqual({
      courseFee: 0,
      rtoCost: 0,
      referralCommission: 0,
      collected: $(200),
      due: 0,
      rtoDue: 0,
      hold: 0,
      profit: 0,
      netProfit: 0,
    })
  })
})

describe('expenseTotals', () => {
  it('totals, splits by each expense, and groups by category', () => {
    const t = expenseTotals(
      [
        { spentOn: '2026-03-01', amountAud: $(1000), split: 'shared', category: 'Ads' },
        { spentOn: '2026-03-02', amountAud: $(250), split: 'tanvir', category: 'Software' },
        { spentOn: '2026-03-03', amountAud: $(500), split: 'shared', category: 'Ads' },
        { spentOn: '2026-03-04', amountAud: $(100), split: 'md', category: 'Phone' },
      ],
      settings,
    )
    expect(t.total).toBe($(1850))
    expect(t.split).toEqual({ tanvir: $(600 + 250 + 300), md: $(400 + 200 + 100) })
    expect(t.split.tanvir + t.split.md).toBe(t.total)
    expect(t.byCategory).toEqual([
      { category: 'Ads', amount: $(1500) },
      { category: 'Software', amount: $(250) },
      { category: 'Phone', amount: $(100) },
    ])
  })
})

describe('sumBdtAsAud', () => {
  it('rounds each amount on its own', () => {
    expect(sumBdtAsAud([22000, 22000], 88.4)).toBe($(497.74)) // 248.87 each
    expect(sumBdtAsAud([100, 100, 100], 3)).toBe($(99.99)) // 33.33 each, not 300 / 3 = 100.00
  })
})

describe('invoiceTotals', () => {
  it('adds up lines, with GST as 1/11 of the total', () => {
    const t = invoiceTotals([{ quantity: 1, unitPrice: $(1600) }, { quantity: 2, unitPrice: $(50) }], $(400), true)
    expect(t).toEqual({ total: $(1700), gst: $(154.55), paid: $(400), due: $(1300) })
  })

  it('has no GST when prices exclude it, and due never goes below 0', () => {
    const t = invoiceTotals([{ quantity: 1, unitPrice: $(1000) }], $(1200), false)
    expect(t.gst).toBe(0)
    expect(t.due).toBe(0)
  })

  it('instalments: same invoice, smaller due each version', () => {
    const lines = [{ quantity: 1, unitPrice: $(1600) }]
    expect(invoiceTotals(lines, $(400), true).due).toBe($(1200))
    expect(invoiceTotals(lines, $(1000), true).due).toBe($(600))
    expect(invoiceTotals(lines, $(1600), true).due).toBe(0)
  })
})
