/** Lazy entry point: `await import('../pdf/render')` keeps @react-pdf out of the main bundle. */
import { pdf } from '@react-pdf/renderer'
import type { InvoiceDocumentData } from '../schema'
import { InvoiceDocument } from './InvoiceDocument'

export function renderInvoicePdf(data: InvoiceDocumentData): Promise<Blob> {
  return pdf(<InvoiceDocument data={data} />).toBlob()
}
