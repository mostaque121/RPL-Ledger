import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  CrownIcon,
  HourglassIcon,
  LandmarkIcon,
  MinusIcon,
  ReceiptIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import type { CompanyMonth, Month } from '@/lib/accounting'
import { formatAudShort } from '@/lib/format'
import type { Cents } from '@/lib/money'
import { cn } from '@/lib/utils'

/** Whether a rise is good news (green), bad news (red) or neither (grey). */
type Good = 'up' | 'down' | 'neutral'

interface Kpi {
  label: string
  icon: LucideIcon
  value: (m: CompanyMonth) => Cents
  good: Good
  /** "as of month end" figures are balances, not flows. */
  note?: string
  to?: string
}

interface KpiGridProps {
  month: Month
  names: { tanvir: string; md: string }
  /** Null while sales and expenses load: the tiles keep their labels, the figures wait. */
  data: { current: CompanyMonth; previous: CompanyMonth; previousLabel: string } | null
}

function Delta({ value, previous, good, previousLabel }: { value: Cents; previous: Cents; good: Good; previousLabel: string }) {
  const diff = value - previous
  const Icon = diff > 0 ? ArrowUpRightIcon : diff < 0 ? ArrowDownRightIcon : MinusIcon
  const better = good === 'neutral' || diff === 0 ? null : (diff > 0) === (good === 'up')
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className={cn('size-3.5', better === true && 'text-success', better === false && 'text-danger')} />
      <span className="money">
        {diff > 0 ? '+' : diff < 0 ? '−' : ''}
        {formatAudShort(Math.abs(diff))}
      </span>
      <span>vs {previousLabel}</span>
    </p>
  )
}

/** The eight headline figures for the month, each compared with the month before. */
export function KpiGrid({ month, names, data }: KpiGridProps) {
  const kpis: Kpi[] = [
    { label: 'Cash in', icon: WalletIcon, value: (m) => m.cashIn, good: 'up' },
    { label: 'RTO paid', icon: LandmarkIcon, value: (m) => m.rtoPaid, good: 'neutral' },
    { label: 'Expenses', icon: ReceiptIcon, value: (m) => m.expenses, good: 'down', to: `/expenses?month=${month}` },
    {
      label: 'Company profit',
      icon: TrendingUpIcon,
      value: (m) => m.companyProfit,
      good: 'up',
      note: 'completed sales − expenses',
    },
    {
      label: `${names.tanvir} take-home`,
      icon: CrownIcon,
      value: (m) => m.takeHome.tanvir,
      good: 'up',
      to: `/statement?month=${month}`,
    },
    {
      label: `${names.md} take-home`,
      icon: CrownIcon,
      value: (m) => m.takeHome.md,
      good: 'up',
      to: `/statement?month=${month}`,
    },
    {
      label: 'Client dues',
      icon: HourglassIcon,
      value: (m) => m.dues,
      good: 'down',
      note: 'owed at month end',
      to: '/sales?month=all&payment=due',
    },
    {
      label: 'RTO hold',
      icon: BanknoteIcon,
      value: (m) => m.hold,
      good: 'neutral',
      note: 'held at month end',
      to: '/sales?month=all&rtoPay=due',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((k, i) => {
        const value = data && k.value(data.current)
        const body = (
          <>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <k.icon className="size-3.5" />
              <span className="truncate">{k.label}</span>
            </p>
            {data && value !== null ? (
              <p className={cn('money mt-1.5 text-lg font-extrabold sm:text-xl', value < 0 && 'text-danger')}>{formatAudShort(value)}</p>
            ) : (
              <div className="mt-1.5">
                <SkeletonText size="xl" className={i % 2 ? 'w-20' : 'w-24'} />
              </div>
            )}
            {k.note && <p className="text-[11px] text-muted-foreground">{k.note}</p>}
            {data && value !== null ? (
              <Delta value={value} previous={k.value(data.previous)} good={k.good} previousLabel={data.previousLabel} />
            ) : (
              <div className="mt-1">
                <SkeletonText size="xs" className="w-32" />
              </div>
            )}
          </>
        )
        const tile = 'block rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:p-4'
        return k.to ? (
          <Link key={k.label} to={k.to} className={cn(tile, 'transition-shadow hover:ring-primary/40')}>
            {body}
          </Link>
        ) : (
          <div key={k.label} className={tile}>
            {body}
          </div>
        )
      })}
    </div>
  )
}
