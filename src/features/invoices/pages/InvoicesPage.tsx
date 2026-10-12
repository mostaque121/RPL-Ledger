import { useCallback, useMemo } from 'react'
import { FileTextIcon, PlusIcon, SearchXIcon } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryView } from '@/components/feedback/QueryView'
import { PageActions } from '@/components/layout/PageActions'
import { Button } from '@/components/ui/button'
import { oneOf, useUrlFilters, useUrlParam } from '@/hooks/use-url-filters'
import { todayInSydney } from '@/lib/format'
import { useInvoicesQuery, type Invoice } from '../api/invoices'
import { InvoiceDrawer } from '../components/InvoiceDrawer'
import { InvoicesFilterBar } from '../components/InvoicesFilterBar'
import { InvoicesTable, InvoicesTableSkeleton } from '../components/InvoicesTable'
import { filterInvoices, type InvoiceFilters } from '../filters'
import { useInvoiceModal, useInvoiceModalOpen } from '../hooks/use-invoice-modal'

const defaults = (): InvoiceFilters => ({ status: 'all', search: '' })
const validators = { status: oneOf(['all', 'Due', 'Overdue', 'Paid']) }

/**
 * Invoices, one row per number. `?invoice=<id>` opens one in the drawer. Creating and updating
 * happen in the app-wide invoice modal (`useInvoiceModal`), so Back closes it.
 */
export function InvoicesPage() {
  const invoices = useInvoicesQuery()
  const modal = useInvoiceModal()
  const modalOpen = useInvoiceModalOpen()
  const { filters, setFilters } = useUrlFilters(defaults, validators)
  const [openId, setOpenId] = useUrlParam('invoice')
  const today = todayInSydney()

  const shown = useMemo(() => (invoices.data ? filterInvoices(invoices.data, filters, today) : []), [invoices.data, filters, today])
  const open = invoices.data?.find((i) => i.id === openId) ?? null
  const onOpen = useCallback((i: Invoice) => setOpenId(i.id), [setOpenId])

  const newButton = (label: string, className?: string) => (
    <Button onClick={() => modal.openNew()}>
      <PlusIcon />
      <span className={className}>{label}</span>
    </Button>
  )

  return (
    <>
      <PageActions>{newButton('New invoice', 'hidden sm:inline')}</PageActions>

      <QueryView
        query={invoices}
        loading={
          <div className="space-y-4">
            <InvoicesFilterBar filters={filters} onChange={setFilters} />
            <InvoicesTableSkeleton />
          </div>
        }
      >
        {(all) =>
          all.length === 0 ? (
            <EmptyState
              icon={FileTextIcon}
              title="No invoices yet"
              description="Create one here, or from a sale so the client and course are filled in. Company and bank details come from Settings."
              action={newButton('New invoice')}
            />
          ) : (
            <div className="space-y-4">
              <InvoicesFilterBar filters={filters} onChange={setFilters} />
              {shown.length === 0 ? (
                <EmptyState icon={SearchXIcon} title="No matching invoices" description="Try another search, or clear the filters." />
              ) : (
                <InvoicesTable invoices={shown} today={today} onOpen={onOpen} />
              )}
            </div>
          )
        }
      </QueryView>

      <InvoiceDrawer
        // Hidden while the form modal is up (both are dialogs); Back from the modal brings it back.
        invoice={modalOpen ? null : open}
        today={today}
        onClose={() => setOpenId(null)}
        onUpdate={(invoice) => modal.openUpdate(invoice.id)}
      />
    </>
  )
}
