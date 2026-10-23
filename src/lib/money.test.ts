import { describe, expect, it } from 'vitest'
import { amountToText, parseAmount } from './money'

describe('parseAmount', () => {
  it('parses plain and formatted amounts to minor units', () => {
    expect(parseAmount('1234.5')).toBe(123450)
    expect(parseAmount('1,234.56')).toBe(123456)
    expect(parseAmount('A$1,234')).toBe(123400)
    expect(parseAmount('৳22,000')).toBe(2200000)
    expect(parseAmount(' 22 000 ')).toBe(2200000)
    expect(parseAmount('.5')).toBe(50)
    expect(parseAmount('12.')).toBe(1200)
    expect(parseAmount('-64')).toBe(-6400)
  })

  it('rejects empty and invalid text', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('1.234')).toBeNull()
    expect(parseAmount('1.2.3')).toBeNull()
    expect(parseAmount('-')).toBeNull()
  })

  it('round-trips through amountToText', () => {
    expect(amountToText(123450)).toBe('1234.50')
    expect(amountToText(160000)).toBe('1600')
    expect(amountToText(null)).toBe('')
    expect(parseAmount(amountToText(9999))).toBe(9999)
  })
})
