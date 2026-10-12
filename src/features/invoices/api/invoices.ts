import { useQuery } from '@tanstack/react-query'
import { useAppMutation } from '@/hooks/use-app-mutation'
import { invoiceTotals, type InvoiceTotals, type IsoDate } from '@/lib/accounting'
import { unwrap } from '@/lib/errors'
import { fromCents, toCents } from '@/lib/money'
import { supabase } from '@/lib/supabase'
import type { InvoiceVersionJson } from '@/types/db'
import type { InvoiceDocumentData, InvoiceItemValues, InvoiceValues, IssuerValues } from '../schema'
import { invoiceFileName } from '../numbering'
import { issuerFromJson, issuerToJson } from './profile'

const BUCKET = 'invoices'

export interface InvoiceVersion {
  id: string
  version: number
  issuedOn: IsoDate
  dueOn: IsoDate
  billToName: string
  billToEmail: string | null
  billToPhone: string | null
  items: InvoiceItemValues[]
  amountPaid: number
  gstIncluded: boolean
  notes: string | null
  issuer: IssuerValues
  pdfPath: string
  /** When this version was made (timestamp). */
  createdAt: string
  totals: InvoiceTotals
}

export interface Invoice {
  id: string
  number: string
  saleId: string | null
  saleClientName: string | null
  /** Oldest first; never empty. */
  versions: InvoiceVersion[]
  latest: InvoiceVersion
}

export const invoiceKeys = {
  all: ['invoices'] as const,
  pdf: (path: string) => ['invoice-pdf', path] as const,
}

const INVOICE_COLUMNS = `
  id, invoice_number, sale_id,
  sale:sales(client_name),
  versions:invoice_versions(*)
`

/** Every invoice with all its versions, most recently updated first. */
async function fetchInvoices(): Promise<Invoice[]> {
  const rows = unwrap(await supabase.from('invoices').select(INVOICE_COLUMNS))
  const invoices = rows
    .filter((r) => r.versions.length > 0)
    .map((r): Invoice => {
      const versions = r.versions
        .map((v): InvoiceVersion => {
          const items = v.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: toCents(i.unit_price),
          }))
          const amountPaid = toCents(v.amount_paid)
          return {
            id: v.id,
            version: v.version,
            issuedOn: v.issued_on,
            dueOn: v.due_on,
            billToName: v.bill_to_name,
            billToEmail: v.bill_to_email,
            billToPhone: v.bill_to_phone,
            items,
            amountPaid,
            gstIncluded: v.gst_included,
            notes: v.notes,
            issuer: issuerFromJson(v.issuer),
            pdfPath: v.pdf_path,
            createdAt: v.created_at,
            totals: invoiceTotals(items, amountPaid, v.gst_included),
          }
        })
        .sort((a, b) => a.version - b.version)
      return {
        id: r.id,
        number: r.invoice_number,
        saleId: r.sale_id,
        saleClientName: r.sale?.client_name ?? null,
        versions,
        latest: versions[versions.length - 1],
      }
    })
  return invoices.sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt))
}

export function useInvoicesQuery() {
  return useQuery({ queryKey: invoiceKeys.all, queryFn: fetchInvoices })
}

/** What gets printed for a saved version. */
export const versionDocument = (invoice: Invoice, v: InvoiceVersion): InvoiceDocumentData => ({
  number: invoice.number,
  issuedOn: v.issuedOn,
  dueOn: v.dueOn,
  billToName: v.billToName,
  billToEmail: v.billToEmail ?? '',
  billToPhone: v.billToPhone ?? '',
  items: v.items,
  amountPaid: v.amountPaid,
  gstIncluded: v.gstIncluded,
  notes: v.notes ?? '',
  issuer: v.issuer,
})

// ---------------------------------------------------------------- PDFs in Storage

function storageError(error: { message: string }): Error {
  if (/bucket not found/i.test(error.message)) {
    return new Error('Invoice storage is not set up. Run supabase/migrations/…_invoices.sql in the Supabase SQL Editor.')
  }
  if (/row-level security|unauthorized/i.test(error.message)) return new Error('Not allowed. Try signing in again.')
  if (/failed to fetch|network/i.test(error.message)) return new Error("Can't reach the server. Check your connection.")
  return new Error(error.message || 'The PDF could not be stored.')
}

/** A stored PDF. Versions never change, so it's fetched once per session. */
export function useInvoicePdfQuery(path: string | null) {
  return useQuery({
    queryKey: invoiceKeys.pdf(path ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).download(path ?? '')
      if (error) throw storageError(error)
      return data
    },
    enabled: !!path,
    staleTime: Infinity,
  })
}

/** File name for a download, the same as in Storage: `RFT-4528_V2.pdf`. */
export const pdfFileName = (invoice: Invoice, version: number) => invoiceFileName(invoice.number, version)

// ---------------------------------------------------------------- save a version

export interface SaveInvoiceInput {
  /** Omit for a new invoice. */
  invoice?: Invoice
  values: InvoiceValues
}

const itemsToJson = (items: InvoiceItemValues[]) =>
  items.map((i) => ({ description: i.description.trim(), quantity: i.quantity, unit_price: fromCents(i.unitPrice) }))

const blankToNull = (text: string) => (text.trim() === '' ? null : text.trim())

/**
 * Renders the PDF in the browser, uploads it, then records the version (one DB transaction).
 * If recording fails, the uploaded file is removed again.
 */
async function saveInvoiceVersion({ invoice, values }: SaveInvoiceInput): Promise<{ id: string; version: number }> {
  const id = invoice?.id ?? crypto.randomUUID()
  const version = (invoice?.latest.version ?? 0) + 1
  const number = invoice?.number ?? values.number.trim()
  // `<invoice id>/RFT-4528_V2.pdf`: the folder keeps invoices apart, the name reads well when downloaded.
  const path = `${id}/${invoiceFileName(number, version)}`

  const { renderInvoicePdf } = await import('../pdf/render')
  const blob = await renderInvoicePdf({ ...values, number })

  const upload = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'application/pdf', upsert: true })
  if (upload.error) throw storageError(upload.error)

  const payload: InvoiceVersionJson = {
    version,
    issued_on: values.issuedOn,
    due_on: values.dueOn,
    bill_to_name: values.billToName.trim(),
    bill_to_email: blankToNull(values.billToEmail),
    bill_to_phone: blankToNull(values.billToPhone),
    items: itemsToJson(values.items),
    amount_paid: fromCents(values.amountPaid),
    gst_included: values.gstIncluded,
    notes: blankToNull(values.notes),
    issuer: issuerToJson(values.issuer),
    pdf_path: path,
  }
  const result = await supabase.rpc('save_invoice_version', {
    p_invoice_id: id,
    p_invoice_number: number,
    p_sale_id: values.saleId || null,
    p_version: payload,
  })
  if (result.error) {
    await supabase.storage.from(BUCKET).remove([path])
    unwrap(result, { '23505': `${number} is already used. Pick another number.` })
  }
  return { id, version }
}

export function useSaveInvoiceMutation() {
  return useAppMutation({
    mutationFn: saveInvoiceVersion,
    invalidate: [invoiceKeys.all],
    success: (r, v) => (r.version === 1 ? `Invoice ${v.values.number.trim()} created` : `${v.invoice?.number} updated to version ${r.version}`),
  })
}

// ---------------------------------------------------------------- delete

/** Removes the invoice, every version and every PDF. */
async function deleteInvoice(invoice: Invoice) {
  unwrap(await supabase.from('invoices').delete().eq('id', invoice.id))
  // The rows are gone; a file left behind is harmless, so this doesn't fail the delete.
  await supabase.storage.from(BUCKET).remove(invoice.versions.map((v) => v.pdfPath))
}

export function useDeleteInvoiceMutation() {
  return useAppMutation({
    mutationFn: deleteInvoice,
    invalidate: [invoiceKeys.all],
    success: (_, inv) => `Invoice ${inv.number} deleted`,
  })
}
