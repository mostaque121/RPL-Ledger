import type { IsoDate } from '@/lib/accounting'
import type { Invoice } from './api/invoices'

export type InvoiceStatus = 'Paid' | 'Overdue' | 'Due'

export interface InvoiceFilters extends Record<string, string> {
  status: 'all' | InvoiceStatus
  search: string
}

/** From the latest version: nothing left to pay → Paid; past the due date → Overdue. */
export function invoiceStatus(invoice: Invoice, today: IsoDate): InvoiceStatus {
  const v = invoice.latest
  if (v.totals.due === 0) return 'Paid'
  return v.dueOn < today ? 'Overdue' : 'Due'
}

export function filterInvoices(invoices: readonly Invoice[], filters: InvoiceFilters, today: IsoDate): Invoice[] {
  const needle = filters.search.trim().toLowerCase()
  return invoices.filter((inv) => {
    if (filters.status !== 'all' && invoiceStatus(inv, today) !== filters.status) return false
    if (!needle) return true
    const v = inv.latest
    return [inv.number, v.billToName, v.billToEmail ?? '', ...v.items.map((i) => i.description)].some((text) =>
      text.toLowerCase().includes(needle),
    )
  })
}
