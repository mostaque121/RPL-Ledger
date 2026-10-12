import { useMemo, useState } from 'react'
import { ChevronsDownUpIcon, ChevronsUpDownIcon, FileSpreadsheetIcon, Loader2Icon, PrinterIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { MonthPicker } from '@/components/forms/MonthPicker'
import { Button } from '@/components/ui/button'
import { usePeopleQuery } from '@/features/employees/api'
import { useExpensesQuery } from '@/features/expenses/api'
import { useSalesQuery } from '@/features/sales/api/sales'
import { useSettingsQuery } from '@/features/settings/api/settings'
import { useUrlFilters } from '@/hooks/use-url-filters'
import { monthlyStatement, monthlyStatementDetail, previousMonth, profitView, type PartnerKey } from '@/lib/accounting'
import { errorMessage } from '@/lib/errors'
import { currentMonth, formatMonth } from '@/lib/format'
import { ProfitViewCard } from '../components/ProfitViewCard'
import { StatementCard, StatementCardSkeleton } from '../components/StatementCard'
import { downloadStatement, type PartnerExport } from '../export'
import { statementLines, type LineKey } from '../lines'

const PARTNERS: { key: PartnerKey; dot: string }[] = [
  { key: 'tanvir', dot: 'bg-primary' },
  { key: 'md', dot: 'bg-info' },
]
const LINE_KEYS: LineKey[] = ['cashIn', 'rtoPaid', 'hold', 'tax', 'expenses', 'employee']

const monthDefaults = () => ({ month: currentMonth() })
const monthValidators = { month: (v: string) => /^\d{4}-\d{2}$/.test(v) }

export function StatementPage() {
  const sales = useSalesQuery()
  const expenses = useExpensesQuery()
  const settings = useSettingsQuery().data
  const people = usePeopleQuery()
  const { filters, setFilters } = useUrlFilters(monthDefaults, monthValidators)
  const { month } = filters
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  const names = useMemo(() => {
    const find = (key: PartnerKey, fallback: string) => people.data?.find((p) => p.partnerKey === key)?.name ?? fallback
    return { tanvir: find('tanvir', 'Tanvir'), md: find('md', 'MD') }
  }, [people.data])

  const data = useMemo(() => {
    if (!sales.data || !expenses.data || !settings) return null
    const prev = previousMonth(month)
    const partners = PARTNERS.map(({ key, dot }) => {
      const detail = monthlyStatementDetail(key, month, sales.data, expenses.data, settings)
      return {
        key,
        dot,
        name: names[key],
        lines: statementLines(detail, settings),
        takeHome: detail.statement.takeHome,
        previous: monthlyStatement(key, prev, sales.data, expenses.data, settings).takeHome,
      }
    })
    return { partners, profit: profitView(month, sales.data, expenses.data, settings) }
  }, [sales.data, expenses.data, settings, month, names])

  const allKeys = PARTNERS.flatMap((p) => LINE_KEYS.map((k) => `${p.key}:${k}`))
  const allOpen = allKeys.every((k) => open.has(k))

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function exportXlsx() {
    if (!data) return
    setExporting(true)
    try {
      const partners: PartnerExport[] = data.partners.map((p) => ({ name: p.name, lines: p.lines, takeHome: p.takeHome }))
      await downloadStatement(month, partners, data.profit)
      toast.success('Excel file downloaded')
    } catch (error) {
      toast.error(`Couldn't create the Excel file. ${errorMessage(error)}`)
    } finally {
      setExporting(false)
    }
  }

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <MonthPicker stepper value={month} onChange={(m) => setFilters({ month: m })} />
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setOpen(allOpen ? new Set() : new Set(allKeys))}>
            {allOpen ? <ChevronsDownUpIcon /> : <ChevronsUpDownIcon />}
            {allOpen ? 'Collapse all' : 'Expand all'}
          </Button>
          <Button variant="outline" onClick={() => window.print()} disabled={!data}>
            <PrinterIcon />
            Print
          </Button>
          <Button onClick={exportXlsx} disabled={!data || exporting}>
            {exporting ? <Loader2Icon className="animate-spin" /> : <FileSpreadsheetIcon />}
            Excel
          </Button>
        </div>
      </div>

      <div className="hidden print:block">
        <p className="text-xl font-extrabold">RPL Ledger — Monthly statement</p>
        <p className="text-sm">{formatMonth(month)}</p>
      </div>

      <p className="text-sm text-muted-foreground print:hidden">
        Cash view for {formatMonth(month)}: money in and out by payment date, less the RTO hold, tax on completed own sales and
        the expense share, plus the share of completed employee sales. Click a line to see the rows behind it.
      </p>
      {/* One column: Tanvir's statement, then MD's, then the profit view. */}
      <div className="grid gap-4">
        {data
          ? data.partners.map((p) => (
              <StatementCard
                key={p.key}
                name={p.name}
                dot={p.dot}
                lines={p.lines}
                takeHome={p.takeHome}
                previous={{ label: formatMonth(previousMonth(month)), takeHome: p.previous }}
                isOpen={(k) => open.has(`${p.key}:${k}`)}
                onToggle={(k) => toggle(`${p.key}:${k}`)}
              />
            ))
          : PARTNERS.map((p) => <StatementCardSkeleton key={p.key} name={names[p.key]} dot={p.dot} />)}
        <ProfitViewCard profit={data?.profit ?? null} names={names} />
      </div>
    </div>
  )
}
