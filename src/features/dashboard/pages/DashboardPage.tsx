import { useMemo, useState } from 'react'
import { BookOpenIcon, BuildingIcon, HourglassIcon, LandmarkIcon } from 'lucide-react'
import { ChartSkeleton } from '@/components/data/ChartSkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { MonthPicker } from '@/components/forms/MonthPicker'
import { Segmented } from '@/components/forms/Segmented'
import { usePeopleQuery } from '@/features/employees/api'
import { useExpensesQuery } from '@/features/expenses/api'
import { useSalesQuery, type SaleView } from '@/features/sales/api/sales'
import { useSaleTasksQuery } from '@/features/sales/api/tasks'
import { taskDue, tasksNeedingAttention } from '@/features/sales/crm'
import { useSettingsQuery } from '@/features/settings/api/settings'
import { useUrlFilters } from '@/hooks/use-url-filters'
import { companyMonth, previousMonth, profitByGroup, salesTotals, type Month } from '@/lib/accounting'
import { currentMonth, formatAudShort, formatDate, formatMonth, todayInSydney } from '@/lib/format'
import { addMonths } from '@/lib/month'
import { AttentionList } from '../components/AttentionList'
import { KpiGrid } from '../components/KpiGrid'
import { ProfitBreakdown } from '../components/ProfitBreakdown'
import { TasksDueList } from '../components/TasksDueList'
import { TrendChart, TrendLegend } from '../components/TrendChart'
import { TrendTable } from '../components/TrendTable'

const monthDefaults = () => ({ month: currentMonth() })
const monthValidators = { month: (v: string) => /^\d{4}-\d{2}$/.test(v) }

type Period = 'month' | 'year'

const saleLine = (s: SaleView) => [s.sellerName, s.rtoName, `sold ${formatDate(s.saleDate)}`].filter(Boolean).join(' · ')

export function DashboardPage() {
  const sales = useSalesQuery()
  const expenses = useExpensesQuery()
  const settings = useSettingsQuery().data
  const people = usePeopleQuery()
  const tasks = useSaleTasksQuery()
  const { filters, setFilters } = useUrlFilters(monthDefaults, monthValidators)
  const { month } = filters
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [period, setPeriod] = useState<Period>('month')

  const names = useMemo(() => {
    const find = (key: string, fallback: string) => people.data?.find((p) => p.partnerKey === key)?.name ?? fallback
    return { tanvir: find('tanvir', 'Tanvir'), md: find('md', 'MD') }
  }, [people.data])

  const data = useMemo(() => {
    if (!sales.data || !expenses.data || !settings) return null
    const s = sales.data
    const e = expenses.data
    const trend = Array.from({ length: 12 }, (_, i) => companyMonth(addMonths(month, i - 11), s, e, settings))
    const live = s.filter((x) => !x.cancelled)
    const due = live.filter((x) => x.summary.due > 0).sort((a, b) => b.summary.due - a.summary.due)
    const rtoUnpaid = live
      .filter((x) => x.summary.rtoDue > 0)
      .sort((a, b) => b.summary.hold - a.summary.hold || b.summary.rtoDue - a.summary.rtoDue)
    return {
      trend,
      current: trend[11],
      previous: trend[10],
      due,
      dueTotal: salesTotals(due).due,
      rtoUnpaid,
      rtoTotal: salesTotals(rtoUnpaid).rtoDue,
    }
  }, [sales.data, expenses.data, settings, month])

  const today = todayInSydney()
  const tasksDue = useMemo(() => {
    if (!tasks.data) return null
    const list = tasksNeedingAttention(tasks.data, today)
    return { list, overdue: list.filter((t) => taskDue(t.dueOn, today) === 'overdue').length }
  }, [tasks.data, today])

  const breakdown = useMemo(() => {
    if (!sales.data || !settings) return null
    const from: Month = period === 'month' ? month : `${month.slice(0, 4)}-01`
    return {
      courses: profitByGroup(sales.data, (s) => s.courseName, from, month, settings),
      rtos: profitByGroup(sales.data, (s) => s.rtoName, from, month, settings),
    }
  }, [sales.data, settings, period, month])

  const failed = sales.error ?? expenses.error
  if (failed) {
    return (
      <ErrorState
        error={failed}
        onRetry={() => {
          void sales.refetch()
          void expenses.refetch()
        }}
      />
    )
  }

  const periodLabel = period === 'month' ? formatMonth(month) : `Jan–${formatMonth(month)}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker stepper value={month} onChange={(m) => setFilters({ month: m })} />
        <p className="text-sm text-muted-foreground">Compared with {formatMonth(previousMonth(month))}</p>
      </div>

      <KpiGrid
        month={month}
        names={names}
        data={data && { current: data.current, previous: data.previous, previousLabel: formatMonth(data.previous.month) }}
      />

      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold">Last 12 months</h2>
            <TrendLegend />
          </div>
          <Segmented
            aria-label="Show as"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
            className="w-40"
          />
        </div>
        {!data ? (
          <ChartSkeleton className="h-72" />
        ) : view === 'chart' ? (
          <TrendChart months={data.trend} selected={month} onSelect={(m) => setFilters({ month: m })} />
        ) : (
          <TrendTable months={data.trend} selected={month} />
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Cash in and expenses by date paid; company profit from sales completed in the month, before tax.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <AttentionList
          title="Clients owing money"
          icon={HourglassIcon}
          sales={data?.due ?? null}
          amount={(s) => s.summary.due}
          detail={saleLine}
          total={data?.dueTotal ?? null}
          tone="text-warning-foreground dark:text-warning"
          seeAll="/sales?month=all&payment=due"
          empty="No client owes anything."
        />
        <AttentionList
          title="RTOs not fully paid"
          icon={LandmarkIcon}
          sales={data?.rtoUnpaid ?? null}
          amount={(s) => s.summary.rtoDue}
          detail={(s) =>
            s.summary.hold > 0 ? `${s.rtoName ?? 'RTO'} · holding ${formatAudShort(s.summary.hold)}` : `${s.rtoName ?? 'RTO'} · nothing held yet`
          }
          total={data?.rtoTotal ?? null}
          tone="text-danger"
          seeAll="/sales?month=all&rtoPay=due"
          empty="Every RTO is paid."
        />
        <TasksDueList tasks={tasksDue?.list ?? null} overdue={tasksDue?.overdue ?? 0} today={today} />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Profit by course and RTO</h2>
            <p className="text-sm text-muted-foreground">Sales completed in {periodLabel}, profit before tax.</p>
          </div>
          <Segmented
            aria-label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year to date' },
            ]}
            className="w-56"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ProfitBreakdown title="By course" icon={BookOpenIcon} groups={breakdown?.courses ?? null} noneLabel="No course" />
          <ProfitBreakdown title="By RTO" icon={BuildingIcon} groups={breakdown?.rtos ?? null} noneLabel="No RTO" />
        </div>
      </section>
    </div>
  )
}
