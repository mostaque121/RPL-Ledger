import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from 'recharts'
import type { CompanyMonth, Month } from '@/lib/accounting'
import { formatAudShort, formatAudCompact, formatMonth } from '@/lib/format'

/**
 * Validated with the dataviz palette checker (light and dark surfaces, all pairs):
 * blue / orange / magenta stay apart for colour-blind readers, unlike green / red.
 */
const SERIES = [
  { key: 'cashIn', label: 'Cash in', color: 'var(--color-chart-cash)', kind: 'bar' },
  { key: 'expenses', label: 'Expenses', color: 'var(--color-chart-expense)', kind: 'bar' },
  { key: 'companyProfit', label: 'Company profit', color: 'var(--color-chart-profit)', kind: 'line' },
] as const

interface Row {
  month: Month
  label: string
  cashIn: number
  expenses: number
  companyProfit: number
}

const shortMonth = (m: Month) => formatMonth(m).replace(' 20', " '") // Mar '26

export function TrendLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          {s.kind === 'bar' ? (
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
          ) : (
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: s.color }} />
          )}
          {s.label}
        </li>
      ))}
    </ul>
  )
}

function TrendTooltip({ active, payload }: Pick<TooltipContentProps<TooltipValueType, string | number>, 'active' | 'payload'>) {
  const row = payload?.[0]?.payload as Row | undefined
  if (!active || !row) return null
  return (
    <div className="min-w-48 rounded-lg bg-popover p-3 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/10">
      <p className="mb-2 font-bold">{formatMonth(row.month)}</p>
      <dl className="space-y-1">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </dt>
            <dd className="money font-semibold">{formatAudShort(row[s.key])}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] text-muted-foreground">Click to open this month</p>
    </div>
  )
}

interface TrendChartProps {
  months: CompanyMonth[]
  selected: Month
  onSelect: (month: Month) => void
}

/** Cash in and expenses as columns, company profit as a line, on one A$ axis. */
export function TrendChart({ months, selected, onSelect }: TrendChartProps) {
  const rows: Row[] = months.map((m) => ({
    month: m.month,
    label: shortMonth(m.month),
    cashIn: m.cashIn,
    expenses: m.expenses,
    companyProfit: m.companyProfit,
  }))
  const selectedLabel = rows.find((r) => r.month === selected)?.label
  const tick = { fill: 'var(--color-muted-foreground)', fontSize: 11 }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={rows}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          barGap={2}
          barCategoryGap="28%"
          onClick={(state) => {
            const row = rows[Number(state?.activeIndex)]
            if (row) onSelect(row.month)
          }}
          className="cursor-pointer"
        >
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeWidth={1} />
          {selectedLabel && (
            <ReferenceArea x1={selectedLabel} x2={selectedLabel} fill="var(--color-accent)" fillOpacity={0.6} ifOverflow="extendDomain" />
          )}
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} tick={tick} interval="preserveStartEnd" />
          <YAxis
            tickFormatter={(v: number) => formatAudCompact(v)}
            tickLine={false}
            axisLine={false}
            tick={tick}
            width={64}
          />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Tooltip content={TrendTooltip} cursor={{ fill: 'var(--color-muted)', opacity: 0.6 }} />
          <Bar dataKey="cashIn" name="Cash in" fill="var(--color-chart-cash)" maxBarSize={24} radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="var(--color-chart-expense)" maxBarSize={24} radius={[4, 4, 0, 0]} />
          <Line
            dataKey="companyProfit"
            name="Company profit"
            type="monotone"
            stroke="var(--color-chart-profit)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={{ r: 4, fill: 'var(--color-chart-profit)', stroke: 'var(--color-card)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--color-chart-profit)', stroke: 'var(--color-card)', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
