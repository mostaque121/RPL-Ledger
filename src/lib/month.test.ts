import { describe, expect, it } from 'vitest'
import { addMonths, firstDayOf, monthOfDate, nextMonth } from './month'

describe('month', () => {
  it('adds months across years', () => {
    expect(nextMonth('2026-12')).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-03', 14)).toBe('2027-05')
    expect(addMonths('2026-03', -15)).toBe('2024-12')
  })

  it('converts between months and DB dates', () => {
    expect(firstDayOf('2026-03')).toBe('2026-03-01')
    expect(monthOfDate('2026-03-01')).toBe('2026-03')
  })
})
