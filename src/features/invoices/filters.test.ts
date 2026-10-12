import { describe, expect, it } from 'vitest'
import { invoiceTotals } from '@/lib/accounting'
import { toCents } from '@/lib/money'
import type { Invoice, InvoiceVersion } from './api/invoices'
import { filterInvoices, invoiceStatus } from './filters'

const $ = toCents

function invoice(number: string, paid: number, dueOn: string, client = 'Jane Citizen'): Invoice {
  const items = [{ description: 'CHC33021 Individual Support', quantity: 1, unitPrice: $(1600) }]
  const v = {
    version: 1,
    dueOn,
    billToName: client,
    billToEmail: null,
    items,
    totals: invoiceTotals(items, $(paid), true),
  } as InvoiceVersion
  return { id: number, number, saleId: null, saleClientName: null, versions: [v], latest: v }
}

const today = '2026-10-12'

describe('invoice filters', () => {
  it('status comes from the latest version', () => {
    expect(invoiceStatus(invoice('RFT-1', 1600, '2026-10-01'), today)).toBe('Paid')
    expect(invoiceStatus(invoice('RFT-2', 400, '2026-10-11'), today)).toBe('Overdue')
    expect(invoiceStatus(invoice('RFT-3', 400, '2026-10-12'), today)).toBe('Due')
  })

  it('searches number, client and items, and filters by status', () => {
    const all = [invoice('RFT-4528', 0, '2026-10-20', 'Jane'), invoice('RFT-4529', 1600, '2026-10-20', 'Bob')]
    expect(filterInvoices(all, { status: 'all', search: '4529' }, today).map((i) => i.number)).toEqual(['RFT-4529'])
    expect(filterInvoices(all, { status: 'all', search: 'jane' }, today).map((i) => i.number)).toEqual(['RFT-4528'])
    expect(filterInvoices(all, { status: 'all', search: 'chc33021' }, today)).toHaveLength(2)
    expect(filterInvoices(all, { status: 'Paid', search: '' }, today).map((i) => i.number)).toEqual(['RFT-4529'])
  })
})
