import { describe, expect, it } from 'vitest'
import { invoiceTotals } from '@/lib/accounting'
import { toCents } from '@/lib/money'
import type { Invoice, InvoiceVersion } from './api/invoices'
import type { InvoiceProfile } from './api/profile'
import { blankDraft, dueDate, nextVersionDraft, saleFields, type InvoiceSaleSource } from './draft'

const $ = toCents

const profile: InvoiceProfile = {
  companyName: 'RPL Fast Track',
  address: '1 George St\nSydney NSW 2000',
  phone: '0400 000 000',
  email: '',
  website: 'rplfasttrack.com.au',
  abn: '12 345 678 901',
  bankAccountName: 'RPL Fast Track',
  bankBsb: '062-000',
  bankAccountNumber: '1234 5678',
  numberPrefix: 'RFT-',
  firstNumber: 4528,
  paymentTermsDays: 7,
  gstIncluded: true,
  defaultNotes: 'Thanks!',
}

const sale: InvoiceSaleSource = {
  id: 'sale-1',
  clientName: 'Jane Citizen',
  email: 'jane@example.com',
  phone: null,
  courseName: 'CHC33021 Certificate III in Individual Support',
  courseFee: $(1600),
  collected: $(400),
}

function version(overrides: Partial<InvoiceVersion> = {}): InvoiceVersion {
  const items = [{ description: 'CHC33021', quantity: 1, unitPrice: $(1600) }]
  return {
    id: 'v1',
    version: 1,
    issuedOn: '2026-10-01',
    dueOn: '2026-10-08',
    billToName: 'Jane Citizen',
    billToEmail: 'jane@example.com',
    billToPhone: null,
    items,
    amountPaid: $(400),
    gstIncluded: true,
    notes: 'Old note',
    issuer: { ...blankDraft(profile, '', '2026-10-01').issuer, phone: 'old phone' },
    pdfPath: 'x/v1.pdf',
    createdAt: '2026-10-01T00:00:00Z',
    totals: invoiceTotals(items, $(400), true),
    ...overrides,
  }
}

const invoice = (v: InvoiceVersion, saleId: string | null = 'sale-1'): Invoice => ({
  id: 'inv-1',
  number: 'RFT-4528',
  saleId,
  saleClientName: 'Jane Citizen',
  versions: [v],
  latest: v,
})

describe('invoice drafts', () => {
  it('due date adds the payment terms', () => {
    expect(dueDate('2026-10-28', 7)).toBe('2026-11-04')
    expect(dueDate('2026-10-28', 0)).toBe('2026-10-28')
  })

  it('a blank draft uses the Settings defaults', () => {
    const d = blankDraft(profile, 'RFT-4528', '2026-10-12')
    expect(d.number).toBe('RFT-4528')
    expect(d.dueOn).toBe('2026-10-19')
    expect(d.notes).toBe('Thanks!')
    expect(d.issuer.bankBsb).toBe('062-000')
    expect(d.gstIncluded).toBe(true)
  })

  it('a sale fills the client, one course line, and what was paid', () => {
    expect(saleFields(sale)).toEqual({
      saleId: 'sale-1',
      billToName: 'Jane Citizen',
      billToEmail: 'jane@example.com',
      billToPhone: '',
      items: [{ description: 'CHC33021 Certificate III in Individual Support', quantity: 1, unitPrice: $(1600) }],
      amountPaid: $(400),
    })
    expect(saleFields({ ...sale, collected: $(-50) }).amountPaid).toBe(0)
  })

  it('the next version keeps what was sent, dated today, with the paid amount from the sale', () => {
    const d = nextVersionDraft(invoice(version()), profile, '2026-10-20', { ...sale, collected: $(1000) })
    expect(d.number).toBe('RFT-4528')
    expect(d.issuedOn).toBe('2026-10-20')
    expect(d.dueOn).toBe('2026-10-27')
    expect(d.amountPaid).toBe($(1000))
    expect(d.notes).toBe('Old note')
    // The issuer printed last time is kept, not replaced by today's Settings.
    expect(d.issuer.phone).toBe('old phone')
  })

  it('without a sale, the next version keeps the last paid amount', () => {
    const d = nextVersionDraft(invoice(version(), null), profile, '2026-10-20')
    expect(d.saleId).toBe('')
    expect(d.amountPaid).toBe($(400))
  })
})
