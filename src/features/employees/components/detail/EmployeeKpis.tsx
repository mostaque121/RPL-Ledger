import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BadgePercentIcon,
  CircleCheckBigIcon,
  HandCoinsIcon,
  MinusIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { formatAudShort, formatBdt } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EmployeePeriod, StatExpense, StatSale } from '../../stats'

type Figures = EmployeePeriod<StatSale, StatExpense>

interface EmployeeKpisProps {
  current: Figures
  /** The month before, for the change line. Null for all time. */
  previous: Figures | null
  previousLabel: string
  names: { tanvir: string; md: string }
  /** Commission still owed, all time. */
  owed: { count: number; bdt: number }
  /** Neither completed nor cancelled yet, all time. */
  openNow: number
}

interface Tile {
  label: string
  icon: LucideIcon
  value: string
  tone?: string
  sub: string
  /** Change vs the month before. */
  change?: { now: number; before: number; format: (n: number) => string }
}

/** The six tiles, in order. Shared with the loading skeleton so the labels never differ. */
const TILES = {
  sales: { label: 'Sales made', icon: ReceiptTextIcon },
  completed: { label: 'Completed', icon: CircleCheckBigIcon },
  net: { label: 'Net profit brought in', icon: TrendingUpIcon },
  pay: { label: 'Paid to them', icon: HandCoinsIcon },
  after: { label: 'Left after their pay', icon: PiggyBankIcon },
  owed: { label: 'Commission owed', icon: BadgePercentIcon },
} as const

const GRID = 'grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6'
const TILE = 'min-w-0 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:p-4'

function TileLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </p>
  )
}

/** The tiles while the figures load: labels in place, the values waiting. `compare` adds the change line's place. */
export function EmployeeKpisSkeleton({ compare }: { compare: boolean }) {
  return (
    <div className={GRID} aria-hidden>
      {Object.values(TILES).map((t, i) => (
        <div key={t.label} className={TILE}>
          <TileLabel icon={t.icon} label={t.label} />
          <div className="mt-1.5">
            <SkeletonText size="xl" className={i % 2 ? 'w-16' : 'w-20'} />
          </div>
          <SkeletonText size="11px" className="w-24" />
          {compare && i !== 3 && i !== 5 && <SkeletonText size="xs" className="mt-1 w-28" />}
        </div>
      ))}
    </div>
  )
}

const liveCount = (f: Figures) => f.sold.filter((s) => !s.cancelled).length
const count = (n: number) => String(n)

function Change({ now, before, format, label }: NonNullable<Tile['change']> & { label: string }) {
  const diff = now - before
  const Icon = diff > 0 ? ArrowUpRightIcon : diff < 0 ? ArrowDownRightIcon : MinusIcon
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className={cn('size-3.5', diff > 0 && 'text-success', diff < 0 && 'text-danger')} />
      <span className="money">
        {diff > 0 ? '+' : diff < 0 ? '−' : ''}
        {format(Math.abs(diff))}
      </span>
      <span>vs {label}</span>
    </p>
  )
}

/** The period's headline figures. Commission owed and "open right now" are always all-time. */
export function EmployeeKpis({ current, previous, previousLabel, names, owed, openNow }: EmployeeKpisProps) {
  const cancelled = current.sold.length - liveCount(current)
  const vs = (now: number, before: number | undefined, format: (n: number) => string) =>
    before === undefined ? undefined : { now, before, format }

  const tiles: Tile[] = [
    {
      ...TILES.sales,
      value: count(liveCount(current)),
      sub: cancelled ? `${cancelled} cancelled` : 'by sale date',
      change: vs(liveCount(current), previous ? liveCount(previous) : undefined, count),
    },
    {
      ...TILES.completed,
      value: count(current.completed.length),
      sub: `${openNow} open right now`,
      change: vs(current.completed.length, previous?.completed.length, count),
    },
    {
      ...TILES.net,
      value: formatAudShort(current.netProfit),
      tone: current.netProfit > 0 ? 'text-success' : undefined,
      sub: `${names.tanvir} ${formatAudShort(current.share.tanvir)} · ${names.md} ${formatAudShort(current.share.md)}`,
      change: vs(current.netProfit, previous?.netProfit, formatAudShort),
    },
    {
      ...TILES.pay,
      value: formatAudShort(current.pay),
      sub: `${formatBdt(current.payBdt)} salary + commission`,
    },
    {
      ...TILES.after,
      value: formatAudShort(current.afterPay),
      tone: current.afterPay < 0 ? 'text-danger' : undefined,
      sub: 'net profit − pay',
      change: vs(current.afterPay, previous?.afterPay, formatAudShort),
    },
    {
      ...TILES.owed,
      value: owed.count ? formatBdt(owed.bdt) : '—',
      tone: owed.count ? 'text-warning-foreground dark:text-warning' : undefined,
      sub: owed.count ? `${owed.count} sale${owed.count === 1 ? '' : 's'} · all time` : 'nothing owed',
    },
  ]

  return (
    <div className={GRID}>
      {tiles.map((t) => (
        <div key={t.label} className={TILE}>
          <TileLabel icon={t.icon} label={t.label} />
          <p className={cn('money mt-1.5 text-lg font-extrabold sm:text-xl', t.tone)}>{t.value}</p>
          <p className="truncate text-[11px] text-muted-foreground">{t.sub}</p>
          {t.change && <Change {...t.change} label={previousLabel} />}
        </div>
      ))}
    </div>
  )
}
