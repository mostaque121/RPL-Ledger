import { ChevronRightIcon, FileTextIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Amount } from '@/components/data/Amount'
import { AddButton, LIST_CARD, SectionEmpty, SectionHeader } from '@/components/data/Section'
import { formatDate, todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useInvoicesQuery } from '../api/invoices'
import { useInvoiceModal } from '../hooks/use-invoice-modal'
import { invoiceStatus } from '../filters'
import { InvoiceStatusBadge, VersionBadge } from './InvoiceStatusBadge'

/**
 * On the sale page: this sale's invoices (open them on the Invoices page), and a button that
 * creates or updates the invoice right here in the invoice modal.
 */
export function SaleInvoicesSection({ saleId }: { saleId: string }) {
  const invoices = useInvoicesQuery()
  const mine = (invoices.data ?? []).filter((i) => i.saleId === saleId)
  const today = todayInSydney()
  const modal = useInvoiceModal()
  const latest = mine[0]

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={FileTextIcon}
        tone="info"
        title="Invoices"
        count={mine.length}
        action={
          // Opens the invoice form right here, on top of the sale page.
          <AddButton onClick={() => (latest ? modal.openUpdate(latest.id) : modal.openNew(saleId))}>
            {latest ? 'Update invoice' : 'Add invoice'}
          </AddButton>
        }
      />
      {mine.length === 0 ? (
        <SectionEmpty icon={FileTextIcon}>No invoice yet. Create one from this sale's details.</SectionEmpty>
      ) : (
        <ul className="space-y-2">
          {mine.map((inv) => (
            <li key={inv.id}>
              <Link to={`/invoices?invoice=${inv.id}`} className={cn('group flex items-center gap-3', LIST_CARD)}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-info/15 text-info">
                  <FileTextIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="money font-bold">{inv.number}</span>
                    <VersionBadge version={inv.latest.version} />
                    <InvoiceStatusBadge status={invoiceStatus(inv, today)} />
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Issued {formatDate(inv.latest.issuedOn)} · due {formatDate(inv.latest.dueOn)}
                  </span>
                </span>
                <span className="text-right">
                  <Amount short cents={inv.latest.totals.total} className="block text-base font-bold" />
                  <span className="text-xs text-muted-foreground">
                    Due <Amount short cents={inv.latest.totals.due} className="font-semibold text-foreground" />
                  </span>
                </span>
                <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
