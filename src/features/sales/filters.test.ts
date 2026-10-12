import { describe, expect, it } from 'vitest'
import type { Settings } from '@/lib/accounting'
import { toCents } from '@/lib/money'
import { withSummary, type Sale } from './api/sales'
import { filterSales, type SalesFilters } from './filters'

const settings: Settings = { taxPct: 20, tanvirShare: 60 }
const ALL: SalesFilters = {
  owner: 'all',
  month: 'all',
  sellerId: 'all',
  rtoId: 'all',
  courseId: 'all',
  source: 'all',
  payment: 'all',
  state: 'all',
  rtoPay: 'all',
  search: '',
}

function sale(id: string, overrides: Partial<Sale> = {}) {
  return withSummary(
    {
      id,
      saleDate: '2026-03-02',
      sellerId: 'tanvir-id',
      sellerName: 'Tanvir',
      seller: 'tanvir',
      clientName: `Client ${id}`,
      phone: null,
      email: null,
      courseId: null,
      courseName: 'CHC52021 Diploma of Community Services',
      rtoId: 'acmc',
      rtoName: 'ACMC',
      courseFee: toCents(1000),
      rtoCost: toCents(400),
      referralCommission: 0,
      source: 'Website',
      docsLink: null,
      notes: null,
      completedOn: null,
      cancelled: false,
      payments: [],
      rtoPayments: [],
      commission: null,
      ...overrides,
    },
    settings,
  )
}

const paid = [{ id: 'p', paidOn: '2026-03-02', amount: toCents(1000), note: null }]
const part = [{ id: 'p', paidOn: '2026-03-02', amount: toCents(300), note: null }]

const sales = [
  sale('a', { payments: paid, completedOn: '2026-03-20' }),
  sale('b', { payments: part, saleDate: '2026-04-01', rtoId: 'atr', rtoName: 'ATR' }),
  sale('c', { cancelled: true, sellerId: 'reaz-id', sellerName: 'Reaz', seller: 'employee' }),
  sale('d', { phone: '0412 345 678', courseId: 'chc', source: 'Reference' }),
]
const ids = (f: Partial<SalesFilters>) => filterSales(sales, { ...ALL, ...f }).map((s) => s.id)

describe('filterSales', () => {
  it('filters by sale month, seller and RTO', () => {
    expect(ids({ month: '2026-03' })).toEqual(['a', 'c', 'd'])
    expect(ids({ sellerId: 'reaz-id' })).toEqual(['c'])
    expect(ids({ rtoId: 'atr' })).toEqual(['b'])
  })

  it('splits my sales (Tanvir) from everyone else’s', () => {
    expect(ids({ owner: 'mine' })).toEqual(['a', 'b', 'd'])
    expect(ids({ owner: 'others' })).toEqual(['c'])
  })

  it('filters by course and source', () => {
    expect(ids({ courseId: 'chc' })).toEqual(['d'])
    expect(ids({ source: 'Reference' })).toEqual(['d'])
    expect(ids({ source: 'Website' })).toEqual(['a', 'b', 'c'])
  })

  it('payment filters leave out cancelled sales', () => {
    expect(ids({ payment: 'Paid' })).toEqual(['a'])
    expect(ids({ payment: 'Unpaid' })).toEqual(['d'])
    expect(ids({ payment: 'due' })).toEqual(['b', 'd'])
  })

  it('filters sales the RTO is still owed for', () => {
    expect(ids({ rtoPay: 'due' })).toEqual(['a', 'b', 'd']) // c is cancelled
  })

  it('filters by state', () => {
    expect(ids({ state: 'open' })).toEqual(['b', 'd'])
    expect(ids({ state: 'completed' })).toEqual(['a'])
    expect(ids({ state: 'cancelled' })).toEqual(['c'])
  })

  it('searches name, phone, course, RTO and seller, ignoring case', () => {
    expect(ids({ search: 'client b' })).toEqual(['b'])
    expect(ids({ search: '0412' })).toEqual(['d'])
    expect(ids({ search: 'chc52021' })).toHaveLength(4)
    expect(ids({ search: 'reaz' })).toEqual(['c'])
  })
})
