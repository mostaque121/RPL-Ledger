import { Tabs } from 'radix-ui'
import { UnderlineTabsList, UnderlineTabsTrigger } from '@/components/data/UnderlineTabs'
import { LoadingRegion } from '@/components/feedback/SkeletonText'
import { ActivityTimelineSkeleton } from './ActivityTimeline'
import { SALE_ASIDE, SALE_GRID, SALE_TAB_BAR, SALE_TAB_CONTENT, SALE_TABS, SALE_TABS_ROOT } from './layout'
import { Panel } from './Panel'
import { SaleAboutSkeleton } from './SaleAbout'
import { SaleBalanceSkeleton } from './SaleBalance'
import { SaleIdentitySkeleton } from './SaleIdentity'
import { SaleMoneySummarySkeleton } from './SaleMoneySummary'

/** The sale page while the sale loads: the same two columns and tabs, each card waiting in place. */
export function SaleDetailSkeleton() {
  return (
    <LoadingRegion label="Loading sale" className={SALE_GRID}>
      <aside aria-label="Sale details" className={SALE_ASIDE}>
        <SaleIdentitySkeleton />
        <SaleBalanceSkeleton />
        <SaleAboutSkeleton />
      </aside>

      {/* Controlled with no handler: the tabs show, but switching waits for the sale. */}
      <Tabs.Root value="overview" className={SALE_TABS_ROOT}>
        <div className={SALE_TAB_BAR}>
          <UnderlineTabsList aria-label="Sale sections">
            {SALE_TABS.map((t) => (
              <UnderlineTabsTrigger key={t.value} value={t.value} countPending={t.value !== 'overview'}>
                {t.label}
              </UnderlineTabsTrigger>
            ))}
          </UnderlineTabsList>
        </div>
        <div className={SALE_TAB_CONTENT}>
          <SaleMoneySummarySkeleton />
          <Panel className="p-4 sm:p-5">
            <ActivityTimelineSkeleton />
          </Panel>
        </div>
      </Tabs.Root>
    </LoadingRegion>
  )
}
