/**
 * Starting values for the invoice form. Pure, so the prefill rules are easy to test.
 * Everything here is only a default: every field stays editable in the form.
 */
import { addDays, format, parseISO } from 'date-fns'
import type { IsoDate } from '@/lib/accounting'
import type { Cents } from '@/lib/money'
import type { InvoiceProfile } from './api/profile'
import { issuerOf } from './api/profile'
import type { SaleView } from '@/features/sales/api/sales'
import type { Invoice } from './api/invoices'
import type { InvoiceDocumentData, InvoiceValues } from './schema'

/** The sale fields an invoice needs. */
export interface InvoiceSaleSource {
  id: string
  clientName: string
  email: string | null
  phone: string | null
  courseName: string | null
  courseFee: Cents
  /** Money received so far (refunds already taken off). */
  collected: Cents
}

export const dueDate = (issuedOn: IsoDate, termsDays: number): IsoDate =>
  format(addDays(parseISO(issuedOn), termsDays), 'yyyy-MM-dd')

/** A blank invoice with the Settings defaults. */
export function blankDraft(profile: InvoiceProfile, number: string, today: IsoDate): InvoiceValues {
  return {
    number,
    saleId: '',
    issuedOn: today,
    dueOn: dueDate(today, profile.paymentTermsDays),
    billToName: '',
    billToEmail: '',
    billToPhone: '',
    items: [{ description: '', quantity: 1, unitPrice: null as unknown as number }],
    amountPaid: 0,
    gstIncluded: profile.gstIncluded,
    notes: profile.defaultNotes,
    issuer: issuerOf(profile),
  }
}

/** The fields a sale fills in: client, one line for the course, and what's been paid. */
export function saleFields(sale: InvoiceSaleSource) {
  return {
    saleId: sale.id,
    billToName: sale.clientName,
    billToEmail: sale.email ?? '',
    billToPhone: sale.phone ?? '',
    items: [{ description: sale.courseName ?? '', quantity: 1, unitPrice: sale.courseFee }],
    amountPaid: Math.max(0, sale.collected),
  } satisfies Partial<InvoiceValues>
}

/**
 * The next version of an invoice: everything as last sent, dated today.
 * When it's linked to a sale, the amount paid is brought up to date from the sale's payments.
 */
export function nextVersionDraft(
  invoice: Invoice,
  profile: InvoiceProfile,
  today: IsoDate,
  sale?: InvoiceSaleSource,
): InvoiceValues {
  const v = invoice.latest
  return {
    number: invoice.number,
    saleId: invoice.saleId ?? '',
    issuedOn: today,
    dueOn: dueDate(today, profile.paymentTermsDays),
    billToName: v.billToName,
    billToEmail: v.billToEmail ?? '',
    billToPhone: v.billToPhone ?? '',
    items: v.items.map((i) => ({ ...i })),
    amountPaid: sale ? Math.max(0, sale.collected) : v.amountPaid,
    gstIncluded: v.gstIncluded,
    notes: v.notes ?? '',
    issuer: { ...v.issuer },
  }
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** The form as it is right now, made printable: half-typed fields fall back to blanks / zero. */
export function previewDocument(v: InvoiceValues, today: IsoDate): InvoiceDocumentData {
  const issuedOn = ISO.test(v.issuedOn ?? '') ? v.issuedOn : today
  return {
    number: v.number?.trim() || '—',
    issuedOn,
    dueOn: ISO.test(v.dueOn ?? '') ? v.dueOn : issuedOn,
    billToName: v.billToName?.trim() || 'Client name',
    billToEmail: v.billToEmail ?? '',
    billToPhone: v.billToPhone ?? '',
    items: (v.items ?? []).map((i) => ({
      description: i?.description ?? '',
      quantity: Number.isInteger(i?.quantity) && i.quantity > 0 ? i.quantity : 0,
      unitPrice: Number.isInteger(i?.unitPrice) ? i.unitPrice : 0,
    })),
    amountPaid: Number.isInteger(v.amountPaid) ? v.amountPaid : 0,
    gstIncluded: !!v.gstIncluded,
    notes: v.notes ?? '',
    issuer: v.issuer,
  }
}

/** The invoice-relevant part of a sale from the Sales list. */
export const saleSourceOf = (sale: SaleView): InvoiceSaleSource => ({
  id: sale.id,
  clientName: sale.clientName,
  email: sale.email,
  phone: sale.phone,
  courseName: sale.courseName,
  courseFee: sale.courseFee,
  collected: sale.summary.collected,
})
