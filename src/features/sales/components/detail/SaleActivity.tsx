import { LandmarkIcon, WalletIcon } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { UnderlineTabsList, UnderlineTabsTrigger } from '@/components/data/UnderlineTabs'
import { SaleInvoicesSection } from '@/features/invoices/components/SaleInvoicesSection'
import { useInvoicesQuery } from '@/features/invoices/api/invoices'
import type { Settings } from '@/lib/accounting'
import { formatDate } from '@/lib/format'
import { useSaleNotesQuery } from '../../api/notes'
import type { SaleView } from '../../api/sales'
import { useSaleTasksQuery } from '../../api/tasks'
import { NotesPanel } from '../crm/NotesPanel'
import { PinnedNotes } from '../crm/PinnedNotes'
import { TasksPanel } from '../crm/TasksPanel'
import { ActivityTimeline } from './ActivityTimeline'
import { CommissionSection } from './CommissionSection'
import { SALE_TAB_BAR, SALE_TAB_CONTENT, SALE_TABS, SALE_TABS_ROOT, type SaleTab } from './layout'
import { Panel } from './Panel'
import { PaymentsSection } from './PaymentsSection'
import { SaleMoneySummary } from './SaleMoneySummary'

export type { SaleTab } from './layout'

interface SaleActivityProps {
  sale: SaleView
  settings: Settings
  agencies: string[]
  tab: SaleTab
  onTabChange: (tab: SaleTab) => void
}

/** The right side of the sale page: an overview with the activity timeline, then one tab per kind of work. */
export function SaleActivity({ sale, settings, agencies, tab, onTabChange }: SaleActivityProps) {
  const s = sale.summary
  const notes = useSaleNotesQuery(sale.id).data
  const tasks = useSaleTasksQuery().data
  const invoices = useInvoicesQuery().data

  const counts: Record<SaleTab, number | undefined> = {
    overview: undefined,
    payments: sale.payments.length + sale.rtoPayments.length,
    invoices: invoices?.filter((i) => i.saleId === sale.id).length,
    notes: notes?.length,
    tasks: tasks?.filter((t) => t.saleId === sale.id && !t.doneAt).length,
  }

  return (
    <Tabs.Root value={tab} onValueChange={(v) => onTabChange(v as SaleTab)} className={SALE_TABS_ROOT}>
      <div className={SALE_TAB_BAR}>
        <UnderlineTabsList aria-label="Sale sections">
          {SALE_TABS.map((t) => (
            <UnderlineTabsTrigger key={t.value} value={t.value} count={counts[t.value]}>
              {t.label}
            </UnderlineTabsTrigger>
          ))}
        </UnderlineTabsList>
      </div>

      <Tabs.Content value="overview" className={SALE_TAB_CONTENT}>
        <SaleMoneySummary sale={sale} settings={settings} />
        <PinnedNotes saleId={sale.id} />
        <Panel className="p-4 sm:p-5">
          <ActivityTimeline sale={sale} />
        </Panel>
      </Tabs.Content>

      <Tabs.Content value="payments" className={SALE_TAB_CONTENT}>
        <PaymentsSection
          kind="client"
          title="Client payments"
          icon={WalletIcon}
          saleId={sale.id}
          clientName={sale.clientName}
          payments={sale.payments}
          outstanding={sale.cancelled ? 0 : s.due}
          addLabel="Add payment"
          footnote={s.fullyPaidOn && !sale.cancelled ? `Fully paid on ${formatDate(s.fullyPaidOn)}.` : undefined}
        />
        <PaymentsSection
          kind="rto"
          title="RTO payments"
          icon={LandmarkIcon}
          saleId={sale.id}
          clientName={sale.clientName}
          payments={sale.rtoPayments}
          outstanding={sale.cancelled ? 0 : s.rtoDue}
          addLabel="Pay RTO"
          agencies={agencies}
        />
        <CommissionSection sale={sale} />
      </Tabs.Content>

      <Tabs.Content value="invoices" className={SALE_TAB_CONTENT}>
        <SaleInvoicesSection saleId={sale.id} />
      </Tabs.Content>

      <Tabs.Content value="notes" className={SALE_TAB_CONTENT}>
        <NotesPanel saleId={sale.id} />
      </Tabs.Content>

      <Tabs.Content value="tasks" className={SALE_TAB_CONTENT}>
        <TasksPanel saleId={sale.id} />
      </Tabs.Content>
    </Tabs.Root>
  )
}
