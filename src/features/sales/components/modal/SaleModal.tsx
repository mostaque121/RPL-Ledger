import { lazy, Suspense, useState } from 'react'
import { FormModal } from '@/components/layout/FormModal'
import { useSaleModal, type SaleModalRequest } from '../../hooks/use-sale-modal'
import { SaleModalPlaceholder } from './SaleModalPlaceholder'

// The form (and its data) loads the first time the modal opens, not with every page.
const SaleModalContent = lazy(() => import('./SaleModalContent').then((m) => ({ default: m.SaleModalContent })))

const keyOf = (r: SaleModalRequest) => (r.kind === 'new' ? 'new' : `edit:${r.saleId}`)

/**
 * The sale form in a full-page modal. Mounted once in the app layout and driven by the URL
 * (see `useSaleModal`), so it opens on top of whatever page you're on — Back closes it.
 */
export function SaleModal() {
  const modal = useSaleModal()
  const key = modal.request ? keyOf(modal.request) : null

  // Keep the last request after the URL closes the modal, so the form stays put while it slides away.
  const [kept, setKept] = useState<{ key: string; request: SaleModalRequest } | null>(null)
  if (modal.request && key !== kept?.key) setKept({ key: key ?? '', request: modal.request })

  return (
    <FormModal open={modal.request !== null} onOpenChange={(open) => !open && modal.close()} aria-label="Sale">
      {kept && (
        <Suspense fallback={<SaleModalPlaceholder />}>
          <SaleModalContent key={kept.key} request={kept.request} onSaved={modal.finish} />
        </Suspense>
      )}
    </FormModal>
  )
}
