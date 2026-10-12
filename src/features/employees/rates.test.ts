import { describe, expect, it } from 'vitest'
import { rateForMonth, rateOn, sortRates, type PayRate } from './rates'

const rate = (effectiveFrom: string, salaryBdt: number, commissionPerSaleBdt = 500): PayRate => ({
  id: effectiveFrom,
  effectiveFrom,
  salaryBdt,
  commissionPerSaleBdt,
})

// Out of order on purpose.
const rates = [rate('2026-11-01', 25000, 700), rate('2026-03-15', 22000, 500), rate('2026-08-01', 23000, 600)]

describe('rateOn', () => {
  it('picks the latest rate that started on or before the date', () => {
    expect(rateOn(rates, '2026-10-31')?.salaryBdt).toBe(23000)
    expect(rateOn(rates, '2026-11-01')?.salaryBdt).toBe(25000)
    expect(rateOn(rates, '2026-08-01')?.commissionPerSaleBdt).toBe(600)
    expect(rateOn(rates, '2027-05-01')?.salaryBdt).toBe(25000)
  })

  it('uses the earliest rate before any rate started', () => {
    expect(rateOn(rates, '2025-01-01')?.salaryBdt).toBe(22000)
  })

  it('is null with no rates', () => {
    expect(rateOn([], '2026-10-12')).toBeNull()
  })
})

describe('rateForMonth', () => {
  const today = '2026-10-12'

  it('uses the end of a past month (a mid-month raise counts for that month)', () => {
    expect(rateForMonth([rate('2026-01-01', 20000), rate('2026-09-15', 21000)], '2026-09', today)?.salaryBdt).toBe(21000)
    expect(rateForMonth(rates, '2026-07', today)?.salaryBdt).toBe(22000)
  })

  it('uses today for the current month, and the 1st for a future month', () => {
    expect(rateForMonth([rate('2026-01-01', 20000), rate('2026-10-20', 21000)], '2026-10', today)?.salaryBdt).toBe(20000)
    expect(rateForMonth(rates, '2026-11', today)?.salaryBdt).toBe(25000)
  })

  it('handles the end of February', () => {
    expect(rateForMonth([rate('2026-01-01', 1), rate('2026-02-28', 2)], '2026-02', today)?.salaryBdt).toBe(2)
  })
})

describe('sortRates', () => {
  it('orders oldest first', () => {
    expect(sortRates(rates).map((r) => r.effectiveFrom)).toEqual(['2026-03-15', '2026-08-01', '2026-11-01'])
  })
})
