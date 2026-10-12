import { useEffect, useMemo, useState } from 'react'
import { SearchXIcon } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryView } from '@/components/feedback/QueryView'
import type { BackState } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { useSettingsQuery } from '@/features/settings/api/settings'
import type { Settings } from '@/lib/accounting'
import { useSalesQuery, type SaleView } from '../api/sales'
import { SaleAbout } from '../components/detail/SaleAbout'
import { SaleActivity, type SaleTab } from '../components/detail/SaleActivity'
import { SaleBalance } from '../components/detail/SaleBalance'
import { SaleDetailSkeleton } from '../components/detail/SaleDetailSkeleton'
import { SaleIdentity } from '../components/detail/SaleIdentity'
import { SALE_ASIDE, SALE_GRID } from '../components/detail/layout'

/** Distinct agencies used on RTO payments, most used first. */
function agenciesOf(sales: SaleView[]): string[] {
  const counts = new Map<string, number>()
  for (const s of sales) for (const p of s.rtoPayments) if (p.agency) counts.set(p.agency, (counts.get(p.agency) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a)
}

/** One sale on its own page (`/sales/:saleId`): who and what on the left, the work in tabs on the right. */
export function SaleDetailPage() {
  const { saleId = '' } = useParams()
  const navigate = useNavigate()
  const backTo = (useLocation().state as BackState | null)?.from ?? '/sales?month=all'
  const sales = useSalesQuery()
  const settings = useSettingsQuery().data
  const agencies = useMemo(() => (sales.data ? agenciesOf(sales.data) : []), [sales.data])

  // Opened from a scrolled list: start at the top. Desktop scrolls an inner wrapper, phones the window.
  useEffect(() => {
    document.querySelector('[data-slot="app-scroll"]')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [saleId])

  return (
    <QueryView query={sales} loading={<SaleDetailSkeleton />}>
      {(list) => {
        const sale = list.find((s) => s.id === saleId)
        if (!settings) return <SaleDetailSkeleton />
        if (!sale) {
          return (
            <EmptyState
              icon={SearchXIcon}
              title="Sale not found"
              description="It may have been deleted, or the link is wrong."
              action={
                <Button asChild variant="outline">
                  <Link to="/sales?month=all">Go to all sales</Link>
                </Button>
              }
            />
          )
        }
        return (
          <SaleDetail
            key={sale.id}
            sale={sale}
            settings={settings}
            agencies={agencies}
            onDeleted={() => void navigate(backTo, { replace: true })}
          />
        )
      }}
    </QueryView>
  )
}

interface SaleDetailProps {
  sale: SaleView
  settings: Settings
  agencies: string[]
  onDeleted: () => void
}

function SaleDetail({ sale, settings, agencies, onDeleted }: SaleDetailProps) {
  const [tab, setTab] = useState<SaleTab>('overview')
  const tabFor = { note: 'notes', task: 'tasks', payment: 'payments' } as const

  return (
    <div className={SALE_GRID}>
      <aside aria-label="Sale details" className={SALE_ASIDE}>
        <SaleIdentity
          sale={sale}
          onDeleted={onDeleted}
          onQuickAction={(what) => setTab(tabFor[what])}
        />
        <SaleBalance sale={sale} />
        <SaleAbout sale={sale} />
      </aside>

      <SaleActivity sale={sale} settings={settings} agencies={agencies} tab={tab} onTabChange={setTab} />
    </div>
  )
}
