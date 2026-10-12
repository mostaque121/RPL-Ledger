import { Fragment } from 'react'
import { ChevronRightIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { Link } from 'react-router'
import { saleHref } from '@/features/sales/links'
import { pickWidth } from '@/components/feedback/skeleton-widths'
import { LoadingRegion, SkeletonText } from '@/components/feedback/SkeletonText'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatAudShort, formatDate } from '@/lib/format'
import type { Cents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { LineKey, StatementLine, StatementRow } from '../lines'

interface StatementCardProps {
  name: string
  /** Dot colour for the partner. */
  dot: string
  lines: StatementLine[]
  takeHome: Cents
  previous: { label: string; takeHome: Cents }
  isOpen: (key: LineKey) => boolean
  onToggle: (key: LineKey) => void
}

/** In / Out cells: positive goes in "In", negative in "Out" (shown without the sign). */
function InOut({ amount, strong }: { amount: Cents; strong?: boolean }) {
  return (
    <>
      <TableCell className={cn('money text-right text-success', strong && 'font-bold')}>
        {amount > 0 ? formatAudShort(amount) : ''}
      </TableCell>
      <TableCell className={cn('money text-right text-danger', strong && 'font-bold')}>
        {amount < 0 ? formatAudShort(-amount) : ''}
      </TableCell>
    </>
  )
}

function DetailRow({ row }: { row: StatementRow }) {
  return (
    <TableRow className="bg-muted/30 text-xs hover:bg-muted/50">
      <TableCell className="py-1.5 pl-10 whitespace-normal">
        <div className="flex gap-3">
          <span className="w-20 shrink-0 text-muted-foreground">{row.date ? formatDate(row.date) : ''}</span>
          <span className="min-w-0">
            {row.saleId ? (
              <Link
                to={saleHref(row.saleId)}
                className="font-semibold underline-offset-2 hover:underline print:no-underline"
              >
                {row.title}
              </Link>
            ) : (
              <span className="font-semibold">{row.title}</span>
            )}
            <span className="block text-muted-foreground">{row.detail}</span>
          </span>
        </div>
      </TableCell>
      <InOut amount={row.amount} />
      <TableCell />
    </TableRow>
  )
}

const LABEL_WIDTHS = ['w-44', 'w-28', 'w-32', 'w-36', 'w-32', 'w-48'] as const
const HINT_WIDTHS = ['w-56', 'w-52', 'w-64', 'w-60', 'w-44', 'w-72'] as const
/** The six lines: money in on the first and last, out in between (as the real statement usually is). */
const LINE_COUNT = 6

const CARD = 'overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 print:break-inside-avoid print:ring-foreground/30'

function Head() {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableHead className="pl-4">Description</TableHead>
        <TableHead className="text-right">In</TableHead>
        <TableHead className="text-right">Out</TableHead>
        <TableHead className="pr-4 text-right">Balance</TableHead>
      </TableRow>
    </TableHeader>
  )
}

/** A partner's statement while sales and expenses load: the same card and columns, the figures waiting. */
export function StatementCardSkeleton({ name, dot }: { name: string; dot: string }) {
  return (
    <LoadingRegion label={`Loading ${name}'s statement`} className={CARD}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b p-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold">
            <span className={cn('size-2.5 rounded-full', dot)} />
            {name}
          </p>
          <p className="text-xs text-muted-foreground">Take-home</p>
        </div>
        <div>
          <SkeletonText size="3xl" align="right" className="w-36" />
          <SkeletonText size="xs" align="right" className="w-56" />
        </div>
      </div>
      <Table>
        <Head />
        <TableBody>
          {Array.from({ length: LINE_COUNT }, (_, i) => {
            const isIn = i === 0 || i === LINE_COUNT - 1
            return (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell className="pl-2 whitespace-normal">
                  <div className="flex items-start gap-1.5">
                    <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                    <div>
                      <SkeletonText className={pickWidth(LABEL_WIDTHS, i)} />
                      <SkeletonText size="xs" className={pickWidth(HINT_WIDTHS, i)} />
                    </div>
                  </div>
                </TableCell>
                <TableCell>{isIn && <SkeletonText align="right" className="w-16" />}</TableCell>
                <TableCell>{!isIn && <SkeletonText align="right" className="w-14" />}</TableCell>
                <TableCell className="pr-4">
                  <SkeletonText align="right" className="w-16" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell className="pl-4 text-base font-extrabold">Take-home</TableCell>
            <TableCell colSpan={3} className="pr-4">
              <SkeletonText size="base" align="right" className="w-24" />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </LoadingRegion>
  )
}

/** One partner's take-home, line by line like a bank statement, each line expandable. */
export function StatementCard({ name, dot, lines, takeHome, previous, isOpen, onToggle }: StatementCardProps) {
  const diff = takeHome - previous.takeHome
  const Trend = diff >= 0 ? TrendingUpIcon : TrendingDownIcon

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b p-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold">
            <span className={cn('size-2.5 rounded-full', dot)} />
            {name}
          </p>
          <p className="text-xs text-muted-foreground">Take-home</p>
        </div>
        <div className="text-right">
          <p className={cn('money text-3xl font-extrabold', takeHome < 0 ? 'text-danger' : 'text-success')}>
            {formatAudShort(takeHome)}
          </p>
          <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Trend className={cn('size-3.5', diff >= 0 ? 'text-success' : 'text-danger')} />
            {diff >= 0 ? '+' : '−'}
            {formatAudShort(Math.abs(diff))} vs {previous.label} ({formatAudShort(previous.takeHome)})
          </p>
        </div>
      </div>

      <Table>
        <Head />
        <TableBody>
          {lines.map((line) => {
            const open = isOpen(line.key)
            return (
              <Fragment key={line.key}>
                <TableRow className="hover:bg-muted/40">
                  <TableCell className="pl-2 whitespace-normal">
                    <button
                      type="button"
                      onClick={() => onToggle(line.key)}
                      aria-expanded={open}
                      className="flex w-full items-start gap-1.5 text-left"
                    >
                      <ChevronRightIcon
                        className={cn('mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform print:hidden', open && 'rotate-90')}
                      />
                      <span>
                        <span className="font-semibold">{line.label}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">({line.rows.length})</span>
                        <span className="block text-xs text-muted-foreground">{line.hint}</span>
                      </span>
                    </button>
                  </TableCell>
                  <InOut amount={line.amount} strong />
                  <TableCell className={cn('money pr-4 text-right', line.balance < 0 && 'text-danger')}>
                    {formatAudShort(line.balance)}
                  </TableCell>
                </TableRow>
                {open &&
                  (line.rows.length === 0 ? (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={4} className="py-2 pl-10 text-xs text-muted-foreground">
                        Nothing this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    line.rows.map((row) => <DetailRow key={row.id} row={row} />)
                  ))}
              </Fragment>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell className="pl-4 text-base font-extrabold">Take-home</TableCell>
            <TableCell colSpan={3} className={cn('money pr-4 text-right text-base font-extrabold', takeHome < 0 ? 'text-danger' : 'text-success')}>
              {formatAudShort(takeHome)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  )
}
