import { describe, expect, it } from 'vitest'
import { invoiceFileName, isNumberTaken, nextInvoiceNumber } from './numbering'

describe('nextInvoiceNumber', () => {
  it('starts at the first number', () => {
    expect(nextInvoiceNumber([], 'RFT-', 4528)).toBe('RFT-4528')
  })

  it('continues from the highest number used', () => {
    expect(nextInvoiceNumber(['RFT-4528', 'RFT-4531', 'RFT-4529'], 'RFT-', 4528)).toBe('RFT-4532')
  })

  it('ignores other prefixes and hand-typed numbers', () => {
    expect(nextInvoiceNumber(['INV-9000', 'RFT-4600A', 'RFT-4530'], 'RFT-', 4528)).toBe('RFT-4531')
  })

  it('never goes below the first number, and ignores case', () => {
    expect(nextInvoiceNumber(['rft-12'], 'RFT-', 4528)).toBe('RFT-4528')
    expect(nextInvoiceNumber(['rft-5000'], 'RFT-', 4528)).toBe('RFT-5001')
  })
})

describe('isNumberTaken', () => {
  it('matches ignoring case and spaces around it', () => {
    expect(isNumberTaken(' rft-4528 ', ['RFT-4528'])).toBe(true)
    expect(isNumberTaken('RFT-4529', ['RFT-4528'])).toBe(false)
  })
})

describe('invoiceFileName', () => {
  it('is the number and version', () => {
    expect(invoiceFileName('RFT-12121', 1)).toBe('RFT-12121_V1.pdf')
    expect(invoiceFileName(' RFT-4528 ', 3)).toBe('RFT-4528_V3.pdf')
  })

  it('makes odd characters safe for a path', () => {
    expect(invoiceFileName('INV/2026 #7', 2)).toBe('INV-2026-7_V2.pdf')
    expect(invoiceFileName('///', 1)).toBe('invoice_V1.pdf')
  })
})
