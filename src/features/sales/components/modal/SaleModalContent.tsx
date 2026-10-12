import { SearchXIcon } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useSettingsQuery } from '@/features/settings/api/settings'
import { useSalesQuery } from '../../api/sales'
import type { SaleModalRequest } from '../../hooks/use-sale-modal'
import { SaleForm } from '../SaleForm'
import { SaleModalPlaceholder } from './SaleModalPlaceholder'

interface SaleModalContentProps {
  request: SaleModalRequest
  onSaved: (saleId: string, created: boolean) => void
}

/** Loads what the form needs, then shows it. Mounted fresh each time the modal opens. */
export function SaleModalContent({ request, onSaved }: SaleModalContentProps) {
  const settings = useSettingsQuery()
  const sales = useSalesQuery()

  const failed = [settings, sales].find((q) => q.isError)
  if (failed) {
    return (
      <SaleModalPlaceholder>
        <ErrorState error={failed.error} onRetry={() => void failed.refetch()} />
      </SaleModalPlaceholder>
    )
  }
  if (!settings.data || (request.kind === 'edit' && !sales.data)) return <SaleModalPlaceholder />

  const sale = request.kind === 'edit' ? sales.data?.find((s) => s.id === request.saleId) : undefined
  if (request.kind === 'edit' && !sale) {
    return (
      <SaleModalPlaceholder>
        <EmptyState icon={SearchXIcon} title="Sale not found" description="It may have been deleted." />
      </SaleModalPlaceholder>
    )
  }

  return <SaleForm settings={settings.data} sale={sale} onSaved={onSaved} />
}
