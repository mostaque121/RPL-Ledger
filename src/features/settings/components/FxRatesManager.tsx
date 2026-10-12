import { useState, type ReactNode } from 'react'
import { ArrowRightLeftIcon, CopyIcon, PencilIcon, PlusIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { pickWidth } from '@/components/feedback/skeleton-widths'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { currentMonth, formatMonth, formatRate } from '@/lib/format'
import { addMonths, nextMonth } from '@/lib/month'
import { cn } from '@/lib/utils'
import { rateFor, useDeleteFxRateMutation, useUpsertFxRateMutation, type FxRate } from '../api/fx-rates'
import type { FxRateValues } from '../schema'
import { FxRateDialog } from './FxRateDialog'
import { SettingsHeader } from './settings-ui'

const COLLAPSED_ROWS = 12

const signed = (change: number) => `${change > 0 ? '+' : change < 0 ? '−' : ''}${formatRate(Math.abs(change))}`
const changeTone = (change: number | null) =>
  change === null || change === 0 ? 'text-muted-foreground' : change > 0 ? 'text-success' : 'text-danger'

const HEADER = {
  icon: ArrowRightLeftIcon,
  title: 'Exchange rates',
  description: 'One AUD → BDT rate per month, used to convert salaries and other BDT expenses.',
}

function HistoryHead() {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50">
        <TableHead>Month</TableHead>
        <TableHead className="text-right">৳ per A$1</TableHead>
        <TableHead className="text-right">Change</TableHead>
        <TableHead className="w-20" />
      </TableRow>
    </TableHeader>
  )
}

/** The page while the rates load: header, the three figures and the history table, the values waiting. */
export function FxRatesSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading exchange rates">
      <SettingsHeader {...HEADER}>
        <Button disabled>
          <PlusIcon />
          Add rate
        </Button>
      </SettingsHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        {[formatMonth(currentMonth()), 'Change from last month', 'Months recorded'].map((label, i) => (
          <Stat key={label} label={label}>
            <SkeletonText size="xl" className={pickWidth(['w-28', 'w-16', 'w-8'], i)} />
          </Stat>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">History</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <HistoryHead />
            <TableBody>
              {Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell>
                    <SkeletonText className="w-20" />
                  </TableCell>
                  <TableCell>
                    <SkeletonText align="right" className="w-14" />
                  </TableCell>
                  <TableCell>
                    <SkeletonText size="xs" align="right" className="w-10" />
                  </TableCell>
                  {/* The edit / delete buttons' height. */}
                  <TableCell className="h-11" />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}

/** Monthly AUD → BDT rates: this month at a glance, a one-click "copy last month", and the full history. */
export function FxRatesManager({ rates }: { rates: FxRate[] }) {
  const [dialog, setDialog] = useState<{ initial: FxRateValues; editing: boolean } | null>(null)
  const [deleting, setDeleting] = useState<FxRate | null>(null)
  const [showAll, setShowAll] = useState(false)
  const copy = useUpsertFxRateMutation()
  const remove = useDeleteFxRateMutation()

  const thisMonth = currentMonth()
  const latest = rates[0] as FxRate | undefined
  // Copy forward one month at a time, up to next month (so it can be set up early).
  const copyTarget = latest && latest.month < nextMonth(thisMonth) ? nextMonth(latest.month) : null
  const current = rateFor(rates, thisMonth)
  const previous = rateFor(rates, addMonths(thisMonth, -1))
  const monthChange = current !== null && previous !== null ? current - previous : null
  const visible = showAll ? rates : rates.slice(0, COLLAPSED_ROWS)

  const openNew = () =>
    setDialog({
      initial: {
        month: latest ? nextMonth(latest.month) : thisMonth,
        audToBdt: latest?.audToBdt ?? Number.NaN,
      },
      editing: false,
    })

  return (
    <div className="space-y-6">
      <SettingsHeader {...HEADER}>
        <Button onClick={openNew}>
          <PlusIcon />
          Add rate
        </Button>
      </SettingsHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={formatMonth(thisMonth)} warn={current === null}>
          {current === null ? (
            <span className="flex items-center gap-1.5 text-base text-warning">
              <TriangleAlertIcon className="size-4" />
              Not set yet
            </span>
          ) : (
            <>
              ৳{formatRate(current)} <span className="text-xs font-medium text-muted-foreground">per A$1</span>
            </>
          )}
        </Stat>
        <Stat label="Change from last month">
          <span className={changeTone(monthChange)}>{monthChange === null ? '—' : signed(monthChange)}</span>
        </Stat>
        <Stat label="Months recorded">{rates.length}</Stat>
      </div>

      {latest && copyTarget && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-accent/60 px-4 py-3 text-sm">
          <CopyIcon className="size-4 shrink-0 text-accent-foreground" />
          <span className="flex-1">
            Rate barely moved? Reuse <span className="money font-bold">{formatRate(latest.audToBdt)}</span> from{' '}
            {formatMonth(latest.month)} for <span className="font-bold">{formatMonth(copyTarget)}</span>.
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={copy.isPending}
            onClick={() => copy.mutate({ month: copyTarget, audToBdt: latest.audToBdt })}
          >
            Copy to {formatMonth(copyTarget)}
          </Button>
        </div>
      )}

      {rates.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeftIcon}
          title="No rates yet"
          description="Add this month's rate so salaries and BDT expenses can be converted."
          action={
            <Button size="sm" onClick={openNew}>
              <PlusIcon />
              Add rate
            </Button>
          }
        />
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-bold">History</h2>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <HistoryHead />
              <TableBody>
                {visible.map((rate, i) => {
                  const prev = rates[i + 1]
                  const change = prev ? rate.audToBdt - prev.audToBdt : null
                  return (
                    <TableRow key={rate.id} className={cn(rate.month === thisMonth && 'bg-accent/40')}>
                      <TableCell className="font-semibold">
                        {formatMonth(rate.month)}
                        {rate.month === thisMonth && (
                          <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground uppercase">
                            Now
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="money text-right font-bold">{formatRate(rate.audToBdt)}</TableCell>
                      <TableCell className={cn('money text-right text-xs', changeTone(change))}>
                        {change === null ? '—' : signed(change)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${formatMonth(rate.month)}`}
                          onClick={() => setDialog({ initial: { month: rate.month, audToBdt: rate.audToBdt }, editing: true })}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:text-danger"
                          aria-label={`Delete ${formatMonth(rate.month)}`}
                          onClick={() => setDeleting(rate)}
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {rates.length > COLLAPSED_ROWS && (
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all ${rates.length} months`}
            </Button>
          )}
        </section>
      )}

      {dialog && (
        <FxRateDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          initial={dialog.initial}
          editing={dialog.editing}
          rates={rates}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete the ${formatMonth(deleting.month)} rate?` : ''}
        description="Expenses already saved keep the rate they were entered with."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => deleting && remove.mutateAsync(deleting.id)}
      />
    </div>
  )
}

function Stat({ label, warn, children }: { label: string; warn?: boolean; children: ReactNode }) {
  return (
    <div className={cn('rounded-lg border px-4 py-3', warn && 'border-warning/50 bg-warning/10')}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="money mt-1 text-xl font-bold">{children}</div>
    </div>
  )
}
