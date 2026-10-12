import type { ReactNode } from 'react'
import { LoadingState } from '@/components/feedback/LoadingState'
import { FormModalBody, FormModalHeader } from '@/components/layout/FormModal'

/** What the invoice modal shows before the form is ready (loading, error, not found). */
export function InvoiceModalPlaceholder({ children }: { children?: ReactNode }) {
  return (
    <>
      <FormModalHeader title="Invoice" />
      <FormModalBody maxWidth="58rem">{children ?? <LoadingState rows={10} />}</FormModalBody>
    </>
  )
}
