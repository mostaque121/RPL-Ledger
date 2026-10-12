import { useEffect, useMemo, useState } from 'react'
import { Tabs } from 'radix-ui'
import { CalendarRangeIcon, SearchXIcon } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { UnderlineTabsList, UnderlineTabsTrigger } from '@/components/data/UnderlineTabs'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { MonthFilter } from '@/components/forms/MonthFilter'
import { Segmented } from '@/components/forms/Segmented'
import type { BackState } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { useExpensesQuery, type Expense } from '@/features/expenses/api'
import { useSalesQuery, type SaleView } from '@/features/sales/api/sales'
import { Panel } from '@/features/sales/components/detail/Panel'
import { saleHref } from '@/features/sales/links'
import type { FxRate } from '@/features/settings/api/fx-rates'
import { useFxRatesQuery } from '@/features/settings/api/fx-rates'
import { useSettingsQuery } from '@/features/settings/api/settings'
import { isMonthOrAll, oneOf, useUrlFilters } from '@/hooks/use-url-filters'
import { previousMonth, type Settings } from '@/lib/accounting'
import { currentMonth, formatMonth } from '@/lib/format'
import { usePeopleQuery, type Person } from '../api'
import { ActivityChart, ActivityLegend } from '../components/detail/ActivityChart'
import { CommissionOwedList } from '../components/detail/CommissionOwedList'
import { EmployeeDetailSkeleton } from '../components/detail/EmployeeDetailSkeleton'
import { EmployeeHeader } from '../components/detail/EmployeeHeader'
import { EmployeeKpis } from '../components/detail/EmployeeKpis'
import { EmployeePayments } from '../components/detail/EmployeePayments'
import { EmployeeSalesList } from '../components/detail/EmployeeSalesList'
import { MonthlyTable } from '../components/detail/MonthlyTable'
import { PayHistory } from '../components/detail/PayHistory'
import { PersonDialog } from '../components/PersonDialog'
import { employeeHistory, employeeOverview, employeePeriod, employeeTrend, owedBdt, type Period } from '../stats'

const TABS = ['sales', 'payments', 'owed', 'pay'] as const
type Tab = (typeof TABS)[number]
const SHOW = ['sold', 'completed'] as const

const defaults = () => ({ month: currentMonth() as Period, tab: 'sales' as Tab, show: 'sold' as (typeof SHOW)[number] })
const validators = { month: isMonthOrAll, tab: oneOf(TABS), show: oneOf(SHOW) }

/** One employee on their own page (`/employees/:employeeId`): figures for a month or all time, and their history. */
export function EmployeeDetailPage() {
  const { employeeId = '' } = useParams()
  const people = usePeopleQuery()
  const sales = useSalesQuery()
  const expenses = useExpensesQuery()
  const fx = useFxRatesQuery()
  const settings = useSettingsQuery()
  const { filters, setFilters } = useUrlFilters(defaults, validators)

  // Opened from a scrolled list: start at the top. Desktop scrolls an inner wrapper, phones the window.
  useEffect(() => {
    document.querySelector('[data-slot="app-scroll"]')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [employeeId])

  const failed = people.error ?? sales.error ?? expenses.error ?? fx.error ?? settings.error
  if (failed) {
    return (
      <ErrorState
        error={failed}
        onRetry={() => [people, sales, expenses, fx, settings].forEach((q) => void q.refetch())}
      />
    )
  }
  if (!people.data || !sales.data || !expenses.data || !fx.data || !settings.data) {
    return (
      <EmployeeDetailSkeleton
        employeeId={employeeId}
        period={filters.month}
        onPeriodChange={(month) => setFilters({ month })}
        tab={filters.tab}
      />
    )
  }

  const employee = people.data.find((p) => p.id === employeeId && p.role === 'employee')
  if (!employee) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="Employee not found"
        description="They may have been deleted, or the link is wrong."
        action={
          <Button asChild variant="outline">
            <Link to="/employees">Go to employees</Link>
          </Button>
        }
      />
    )
  }
  return (
    <EmployeeDetail
      key={employee.id}
      employee={employee}
      people={people.data}
      sales={sales.data}
      expenses={expenses.data}
      fxRates={fx.data}
      settings={settings.data}
    />
  )
}

interface DetailProps {
  employee: Person
  people: Person[]
  sales: SaleView[]
  expenses: Expense[]
  fxRates: FxRate[]
  settings: Settings
}

function EmployeeDetail({ employee, people, sales, expenses, fxRates, settings }: DetailProps) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { filters, setFilters } = useUrlFilters(defaults, validators)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [editing, setEditing] = useState(false)
  const { month, tab, show } = filters
  const id = employee.id
  const isAll = month === 'all'

  const data = useMemo(() => {
    const overview = employeeOverview(id, sales, expenses)
    const mineDates = [
      ...sales.filter((s) => s.sellerId === id).map((s) => s.saleDate),
      ...expenses.filter((e) => e.employeeId === id).map((e) => e.spentOn),
    ].sort()
    return {
      overview,
      owed: { count: overview.owed.length, bdt: owedBdt(overview.owed, employee.rates) },
      since: mineDates[0] ?? null,
      current: employeePeriod(id, month, sales, expenses, settings),
      previous: isAll ? null : employeePeriod(id, previousMonth(month), sales, expenses, settings),
      trend: employeeTrend(id, isAll ? currentMonth() : month, sales, expenses),
      history: employeeHistory(id, sales, expenses),
    }
  }, [id, employee.rates, sales, expenses, settings, month, isAll])

  const names = useMemo(() => {
    const find = (key: string, fallback: string) => people.find((p) => p.partnerKey === key)?.name ?? fallback
    return { tanvir: find('tanvir', 'Tanvir'), md: find('md', 'MD') }
  }, [people])

  const { current, previous } = data
  const listed = (!isAll && show === 'completed' ? current.completed : current.sold)
    .slice()
    .sort((a, b) => b.saleDate.localeCompare(a.saleDate))
  const periodLabel = isAll ? 'all time' : formatMonth(month)
  const openSale = (sale: SaleView) =>
    void navigate(saleHref(sale.id), { state: { from: `${pathname}${search}` } satisfies BackState })

  return (
    <div className="space-y-6">
      <EmployeeHeader employee={employee} since={data.since} period={month} onEditPay={() => setEditing(true)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <MonthFilter value={month} onChange={(m) => setFilters({ month: m })} />
        </div>
        <p className="text-sm text-muted-foreground">
          {isAll ? 'Everything since they started' : `Compared with ${formatMonth(previousMonth(month))}`}
        </p>
      </div>

      <EmployeeKpis
        current={current}
        previous={previous}
        previousLabel={isAll ? '' : formatMonth(previousMonth(month))}
        names={names}
        owed={data.owed}
        openNow={data.overview.open}
      />

      <Panel className="p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <CalendarRangeIcon className="size-4 text-primary" />
              {view === 'chart' ? 'Last 12 months' : 'Every month'}
            </h2>
            {view === 'chart' && <ActivityLegend />}
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
        {view === 'chart' ? (
          <ActivityChart months={data.trend} selected={isAll ? null : month} onSelect={(m) => setFilters({ month: m })} />
        ) : (
          <MonthlyTable months={data.history} highlight={isAll ? '' : month} />
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Net profit (after tax) counts in the month a sale is completed; pay by the date it was paid.
        </p>
      </Panel>

      <Tabs.Root value={tab} onValueChange={(v) => setFilters({ tab: v as Tab })} className="space-y-4">
        <UnderlineTabsList>
          <UnderlineTabsTrigger value="sales" count={listed.length}>
            Sales
          </UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="payments" count={current.payments.length}>
            Payment history
          </UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="owed" count={data.owed.count}>
            Commission owed
          </UnderlineTabsTrigger>
          <UnderlineTabsTrigger value="pay">Pay rates</UnderlineTabsTrigger>
        </UnderlineTabsList>

        <Tabs.Content value="sales" className="space-y-3">
          {!isAll && (
            <Segmented
              aria-label="Which sales"
              value={show}
              onChange={(v) => setFilters({ show: v })}
              options={[
                { value: 'sold', label: `Sold in ${formatMonth(month)}` },
                { value: 'completed', label: `Completed in ${formatMonth(month)}` },
              ]}
              className="w-full max-w-md"
            />
          )}
          <EmployeeSalesList
            sales={listed}
            onOpen={openSale}
            empty={`No sales ${show === 'completed' && !isAll ? 'completed' : 'made'} in ${periodLabel}.`}
          />
        </Tabs.Content>

        <Tabs.Content value="payments">
          <EmployeePayments
            payments={current.payments}
            total={{ bdt: current.payBdt, aud: current.pay }}
            empty={`No salary or commission paid in ${periodLabel}.`}
          />
        </Tabs.Content>

        <Tabs.Content value="owed">
          <CommissionOwedList employee={employee} owed={data.overview.owed} people={people} rates={fxRates} />
        </Tabs.Content>

        <Tabs.Content value="pay">
          <PayHistory employee={employee} />
        </Tabs.Content>
      </Tabs.Root>

      {editing && <PersonDialog open onOpenChange={(open) => !open && setEditing(false)} person={employee} />}
    </div>
  )
}
