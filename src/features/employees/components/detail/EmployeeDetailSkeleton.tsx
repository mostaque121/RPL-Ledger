import { CalendarRangeIcon } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { ChartSkeleton } from '@/components/data/ChartSkeleton'
import { UnderlineTabsList, UnderlineTabsTrigger } from '@/components/data/UnderlineTabs'
import { LoadingRegion } from '@/components/feedback/SkeletonText'
import { MonthFilter } from '@/components/forms/MonthFilter'
import { Segmented } from '@/components/forms/Segmented'
import { Panel } from '@/features/sales/components/detail/Panel'
import { previousMonth } from '@/lib/accounting'
import { formatMonth } from '@/lib/format'
import type { Period } from '../../stats'
import { ActivityLegend } from './ActivityChart'
import { EmployeeHeaderSkeleton } from './EmployeeHeader'
import { EmployeeKpisSkeleton } from './EmployeeKpis'
import { EmployeeSalesListSkeleton } from './EmployeeSalesList'

interface EmployeeDetailSkeletonProps {
  employeeId: string
  period: Period
  onPeriodChange: (period: Period) => void
  /** The tab in the URL, shown as selected. */
  tab: string
}

const TABS = [
  { value: 'sales', label: 'Sales', counted: true },
  { value: 'payments', label: 'Payment history', counted: true },
  { value: 'owed', label: 'Commission owed', counted: true },
  { value: 'pay', label: 'Pay rates', counted: false },
] as const

/**
 * The employee page while people, sales and expenses load: the month filter already works,
 * the header, tiles, chart and list wait in their own places.
 */
export function EmployeeDetailSkeleton({ employeeId, period, onPeriodChange, tab }: EmployeeDetailSkeletonProps) {
  const isAll = period === 'all'
  return (
    <LoadingRegion label="Loading employee" className="space-y-6">
      <EmployeeHeaderSkeleton employeeId={employeeId} period={period} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <MonthFilter value={period} onChange={onPeriodChange} />
        </div>
        <p className="text-sm text-muted-foreground">
          {isAll ? 'Everything since they started' : `Compared with ${formatMonth(previousMonth(period))}`}
        </p>
      </div>

      <EmployeeKpisSkeleton compare={!isAll} />

      <Panel className="p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <CalendarRangeIcon className="size-4 text-primary" />
              Last 12 months
            </h2>
            <ActivityLegend />
          </div>
          <Segmented
            aria-label="Show as"
            value="chart"
            onChange={() => {}}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
            className="w-40"
          />
        </div>
        <ChartSkeleton className="h-64" />
        <p className="mt-2 text-xs text-muted-foreground">
          Net profit (after tax) counts in the month a sale is completed; pay by the date it was paid.
        </p>
      </Panel>

      {/* Controlled with no handler: the tabs show, but switching waits for the data. */}
      <Tabs.Root value={tab} className="space-y-4">
        <UnderlineTabsList>
          {TABS.map((t) => (
            <UnderlineTabsTrigger key={t.value} value={t.value} countPending={t.counted}>
              {t.label}
            </UnderlineTabsTrigger>
          ))}
        </UnderlineTabsList>
        <EmployeeSalesListSkeleton />
      </Tabs.Root>
    </LoadingRegion>
  )
}
