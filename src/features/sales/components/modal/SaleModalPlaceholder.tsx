import type { ReactNode } from 'react'
import { LoadingState } from '@/components/feedback/LoadingState'
import { FormModalBody, FormModalHeader } from '@/components/layout/FormModal'

/** What the sale modal shows before the form is ready (loading, error, not found). */
export function SaleModalPlaceholder({ children }: { children?: ReactNode }) {
  return (
    <>
      <FormModalHeader title="Sale" />
      <FormModalBody maxWidth="52rem">{children ?? <LoadingState rows={10} />}</FormModalBody>
    </>
  )
}
