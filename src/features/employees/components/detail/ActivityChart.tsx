import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from 'recharts'
import type { Month } from '@/lib/accounting'
import { formatAudCompact, formatAudShort, formatMonth } from '@/lib/format'
import type { TrendMonth } from '../../stats'

/** The dashboard's validated colours: magenta profit, orange money out. */
const SERIES = [
  { key: 'netProfit', label: 'Net profit brought in', color: 'var(--color-chart-profit)' },
  { key: 'pay', label: 'Paid to them', color: 'var(--color-chart-expense)' },
] as const

interface Row {
  month: Month
  label: string
  netProfit: number
  pay: number
  sales: number
  completed: number
}

const shortMonth = (m: Month) => formatMonth(m).replace(' 20', " '") // Mar '26

export function ActivityLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

function ActivityTooltip({ active, payload }: Pick<TooltipContentProps<TooltipValueType, string | number>, 'active' | 'payload'>) {
  const row = payload?.[0]?.payload as Row | undefined
  if (!active || !row) return null
  return (
    <div className="min-w-52 rounded-lg bg-popover p-3 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/10">
      <p className="mb-2 font-bold">{formatMonth(row.month)}</p>
      <dl className="space-y-1">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Sales made · completed</dt>
          <dd className="money font-semibold">
            {row.sales} · {row.completed}
          </dd>
        </div>
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

interface ActivityChartProps {
  months: TrendMonth[]
  /** Highlighted column; null for all time. */
  selected: Month | null
  onSelect: (month: Month) => void
}

/** Net profit they brought in against what they were paid, month by month, on one A$ axis. */
export function ActivityChart({ months, selected, onSelect }: ActivityChartProps) {
  const rows: Row[] = months.map((m) => ({
    month: m.month,
    label: shortMonth(m.month),
    netProfit: m.netProfit,
    pay: m.pay,
    sales: m.sales,
    completed: m.completed,
  }))
  const selectedLabel = rows.find((r) => r.month === selected)?.label
  const tick = { fill: 'var(--color-muted-foreground)', fontSize: 11 }

  return (
    <div className="h-64 w-full">
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
          <YAxis tickFormatter={(v: number) => formatAudCompact(v)} tickLine={false} axisLine={false} tick={tick} width={64} />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Tooltip content={ActivityTooltip} cursor={{ fill: 'var(--color-muted)', opacity: 0.6 }} />
          {SERIES.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} maxBarSize={24} radius={[4, 4, 0, 0]} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
