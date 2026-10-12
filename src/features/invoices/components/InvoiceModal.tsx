import { lazy, Suspense, useState } from 'react'
import { FormModal } from '@/components/layout/FormModal'
import { useInvoiceModal, type InvoiceModalRequest } from '../hooks/use-invoice-modal'
import { InvoiceModalPlaceholder } from './InvoiceModalPlaceholder'

// The form (and its data) loads the first time the modal opens, not with every page.
const InvoiceModalContent = lazy(() => import('./InvoiceModalContent').then((m) => ({ default: m.InvoiceModalContent })))

const keyOf = (r: InvoiceModalRequest) => (r.kind === 'new' ? `new:${r.saleId ?? ''}` : `update:${r.invoiceId}`)

/**
 * The invoice form in a full-page modal. Mounted once in the app layout and driven by the URL
 * (see `useInvoiceModal`), so it opens on top of whatever page you're on — Back closes it.
 */
export function InvoiceModal() {
  const modal = useInvoiceModal()
  const key = modal.request ? keyOf(modal.request) : null

  // Keep the last request after the URL closes the modal, so the form stays put while it slides away.
  const [kept, setKept] = useState<{ key: string; request: InvoiceModalRequest } | null>(null)
  if (modal.request && key !== kept?.key) setKept({ key: key ?? '', request: modal.request })

  return (
    <FormModal open={modal.request !== null} onOpenChange={(open) => !open && modal.close()} aria-label="Invoice">
      {kept && (
        <Suspense fallback={<InvoiceModalPlaceholder />}>
          <InvoiceModalContent key={kept.key} request={kept.request} onSaved={modal.finish} />
        </Suspense>
      )}
    </FormModal>
  )
}
