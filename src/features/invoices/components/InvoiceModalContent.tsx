import { useState } from 'react'
import { FileQuestionIcon } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useSalesQuery } from '@/features/sales/api/sales'
import { useInvoicesQuery, type Invoice } from '../api/invoices'
import { useInvoiceProfileQuery } from '../api/profile'
import type { InvoiceModalRequest } from '../hooks/use-invoice-modal'
import { InvoiceEditor } from './InvoiceEditor'
import { InvoiceModalPlaceholder } from './InvoiceModalPlaceholder'

interface InvoiceModalContentProps {
  request: InvoiceModalRequest
  onSaved: (invoiceId: string) => void
}

/** Loads what the form needs, then shows it. Mounted fresh each time the modal opens. */
export function InvoiceModalContent({ request, onSaved }: InvoiceModalContentProps) {
  const invoices = useInvoicesQuery()
  const profile = useInvoiceProfileQuery()
  const sales = useSalesQuery()

  // The invoice being updated, frozen when first found: after saving, the refetched invoice has a
  // newer version, and the form shouldn't flip to "version n+1" while it closes.
  const [frozen, setFrozen] = useState<Invoice | null>(null)
  const found = request.kind === 'update' ? invoices.data?.find((i) => i.id === request.invoiceId) : undefined
  if (found && !frozen) setFrozen(found)
  const invoice = frozen ?? found

  const failed = [invoices, profile, sales].find((q) => q.isError)
  if (failed) {
    return (
      <InvoiceModalPlaceholder>
        <ErrorState error={failed.error} onRetry={() => void failed.refetch()} />
      </InvoiceModalPlaceholder>
    )
  }
  if (!invoices.data || !profile.data || !sales.data) return <InvoiceModalPlaceholder />
  if (request.kind === 'update' && !invoice) {
    return (
      <InvoiceModalPlaceholder>
        <EmptyState icon={FileQuestionIcon} title="Invoice not found" description="It may have been deleted." />
      </InvoiceModalPlaceholder>
    )
  }

  return (
    <InvoiceEditor
      mode={invoice ? { kind: 'version', invoice } : { kind: 'new', saleId: request.kind === 'new' ? request.saleId : null }}
      invoices={invoices.data}
      profile={profile.data}
      sales={sales.data}
      onSaved={onSaved}
    />
  )
}
