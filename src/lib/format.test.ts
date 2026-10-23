import { describe, expect, it } from 'vitest'
import {
  currentMonth,
  formatAud,
  formatAudCompact,
  formatBdt,
  formatDate,
  formatDateTime,
  formatAudShort,
  formatDollars,
  formatMonth,
  formatRate,
  todayInSydney,
} from './format'

describe('format', () => {
  it('formats AUD from cents, dropping .00 but keeping real cents', () => {
    expect(formatAud(123400)).toBe('$1,234')
    expect(formatAud(-6400)).toBe('−$64')
    expect(formatAud(0)).toBe('$0')
    expect(formatAud(24887)).toBe('$248.87')
    expect(formatAud(123450)).toBe('$1,234.50')
  })

  it('formats BDT with South Asian grouping', () => {
    expect(formatBdt(123400)).toBe('৳1,23,400')
    expect(formatBdt(22000)).toBe('৳22,000')
  })

  it('formats FX rates with 2 to 4 decimals', () => {
    expect(formatRate(88.4)).toBe('88.40')
    expect(formatRate(88.4125)).toBe('88.4125')
  })

  it('formats dates and months', () => {
    expect(formatDate('2026-03-05')).toBe('05 Mar 2026')
    expect(formatDate(null)).toBe('—')
    expect(formatMonth('2026-03')).toBe('Mar 2026')
  })

  it('uses Sydney time for today', () => {
    // 31 Mar 2026 14:30 UTC is already 1 Apr 01:30 in Sydney (AEDT, UTC+11)
    const instant = new Date('2026-03-31T14:30:00Z')
    expect(todayInSydney(instant)).toBe('2026-04-01')
    expect(currentMonth(instant)).toBe('2026-04')
  })
})

describe('formatAudCompact', () => {
  it('shortens thousands and millions', () => {
    expect(formatAudCompact(95_000)).toBe('$950')
    expect(formatAudCompact(123_456)).toBe('$1.2K')
    expect(formatAudCompact(-340_000_000)).toBe('−$3.4M')
    expect(formatAudCompact(0)).toBe('$0')
  })
})

describe('formatAudShort', () => {
  it('drops .00 but keeps real cents', () => {
    expect(formatAudShort(123400)).toBe('$1,234')
    expect(formatAudShort(-6400)).toBe('−$64')
    expect(formatAudShort(0)).toBe('$0')
    expect(formatAudShort(24887)).toBe('$248.87')
  })
})

describe('formatDollars', () => {
  it('shows plain dollars with cents', () => {
    expect(formatDollars(123450)).toBe('$1,234.50')
    expect(formatDollars(0)).toBe('$0.00')
    expect(formatDollars(-500)).toBe('−$5.00')
  })
})

describe('formatDateTime', () => {
  it('shows the time in Sydney, whatever the browser zone', () => {
    // 04:45 UTC = 3:45 pm in Sydney (AEDT, UTC+11)
    expect(formatDateTime('2026-10-12T04:45:00Z')).toBe('12 Oct 2026, 3:45 pm')
  })
})
