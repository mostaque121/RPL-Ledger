import { useMemo, type ReactNode } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import {
  BadgePercentIcon,
  CircleCheckBigIcon,
  FileTextIcon,
  HistoryIcon,
  LandmarkIcon,
  ListTodoIcon,
  NotebookPenIcon,
  PartyPopperIcon,
  PinIcon,
  ReceiptTextIcon,
  SquareCheckBigIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react'
import { SectionHeader } from '@/components/data/Section'
import { ErrorState } from '@/components/feedback/ErrorState'
import { pickWidth } from '@/components/feedback/skeleton-widths'
import { LoadingRegion, SkeletonText } from '@/components/feedback/SkeletonText'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoicesQuery } from '@/features/invoices/api/invoices'
import { formatAudShort, formatBdt, formatDate, formatTime, todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSaleNotesQuery } from '../../api/notes'
import type { SaleView } from '../../api/sales'
import { useSaleTasksQuery } from '../../api/tasks'
import { buildTimeline, groupByDay, type TimelineEvent } from '../../timeline'

const TONE = {
  primary: 'bg-accent text-accent-foreground ring-primary/25',
  success: 'bg-success/15 text-success ring-success/30',
  danger: 'bg-danger/15 text-danger ring-danger/30',
  warning: 'bg-warning/15 text-warning-foreground ring-warning/40 dark:text-warning',
  info: 'bg-info/15 text-info ring-info/30',
} as const

const WARN = 'text-warning-foreground dark:text-warning'

interface Shown {
  icon: LucideIcon
  tone: keyof typeof TONE
  title: ReactNode
  detail?: ReactNode
  amount?: { text: string; className: string }
  /** Quoted text under the title (a note). */
  body?: ReactNode
}

function show(e: TimelineEvent): Shown {
  switch (e.kind) {
    case 'created':
      return {
        icon: ReceiptTextIcon,
        tone: 'primary',
        title: 'Sale created',
        detail: (
          <>
            Sold by <span className="font-semibold text-foreground">{e.seller}</span> · course fee{' '}
            <span className="money">{formatAudShort(e.fee)}</span>
          </>
        ),
      }
    case 'payment':
      return e.amount < 0
        ? { icon: WalletIcon, tone: 'warning', title: 'Refund to client', detail: e.note, amount: { text: formatAudShort(e.amount), className: WARN } }
        : { icon: WalletIcon, tone: 'success', title: 'Payment received', detail: e.note, amount: { text: formatAudShort(e.amount), className: 'text-success' } }
    case 'rto-payment':
      return {
        icon: LandmarkIcon,
        tone: 'danger',
        title: e.amount < 0 ? 'Refund from RTO' : 'Paid the RTO',
        detail: [e.agency && `via ${e.agency}`, e.note].filter(Boolean).join(' · ') || undefined,
        amount: { text: formatAudShort(e.amount), className: e.amount < 0 ? WARN : 'text-danger' },
      }
    case 'paid-in-full':
      return { icon: PartyPopperIcon, tone: 'success', title: 'Client paid in full' }
    case 'completed':
      return { icon: CircleCheckBigIcon, tone: 'info', title: 'Sale completed', detail: 'Its profit counts in this month.' }
    case 'commission':
      return {
        icon: BadgePercentIcon,
        tone: 'primary',
        title: 'Employee commission added to expenses',
        amount: { text: e.bdt !== null ? formatBdt(e.bdt) : formatAudShort(e.aud), className: 'text-danger' },
        detail: e.bdt !== null ? <span className="money">≈ {formatAudShort(e.aud)}</span> : undefined,
      }
    case 'invoice':
      return {
        icon: FileTextIcon,
        tone: 'info',
        title: (
          <>
            Invoice <span className="money">{e.number}</span> {e.version === 1 ? 'created' : `updated to V${e.version}`}
          </>
        ),
        amount: { text: formatAudShort(e.total), className: 'text-foreground' },
      }
    case 'note':
      return {
        icon: NotebookPenIcon,
        tone: 'info',
        title: e.pinned ? 'Note added · pinned' : 'Note added',
        body: (
          <span className="flex gap-2">
            {e.pinned && <PinIcon className={cn('mt-0.5 size-3.5 shrink-0 fill-current', WARN)} />}
            <span className="line-clamp-4">{e.body}</span>
          </span>
        ),
      }
    case 'task-added':
      return {
        icon: ListTodoIcon,
        tone: 'primary',
        title: (
          <>
            Task added: <span className="font-semibold">{e.title}</span>
          </>
        ),
        detail: e.dueOn ? `Due ${formatDate(e.dueOn)}` : undefined,
      }
    case 'task-done':
      return {
        icon: SquareCheckBigIcon,
        tone: 'success',
        title: (
          <>
            Task done: <span className="font-semibold">{e.title}</span>
          </>
        ),
      }
  }
}

function dayLabel(day: string, today: string): string {
  const diff = differenceInCalendarDays(parseISO(today), parseISO(day))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return formatDate(day)
}

function EventRow({ event, last }: { event: TimelineEvent; last: boolean }) {
  const { icon: Icon, tone, title, detail, amount, body } = show(event)
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {/* The line joining this event to the next one. */}
      {!last && <span aria-hidden className="absolute top-9 bottom-1 left-[17px] w-px bg-border" />}
      <span className={cn('relative grid size-9 shrink-0 place-items-center rounded-full ring-1 ring-inset', TONE[tone])}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 pt-1.5">
        <div className="flex items-start gap-3">
          <p className="min-w-0 flex-1 text-sm font-medium wrap-break-word">{title}</p>
          {amount && <span className={cn('money shrink-0 text-sm font-bold', amount.className)}>{amount.text}</span>}
        </div>
        {(detail || event.at) && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[event.at && formatTime(event.at), detail].filter(Boolean).map((part, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                {part}
              </span>
            ))}
          </p>
        )}
        {body && <div className="mt-2 rounded-lg bg-muted/70 px-3 py-2 text-sm whitespace-pre-wrap">{body}</div>}
      </div>
    </li>
  )
}

const TITLE_WIDTHS = ['w-40', 'w-32', 'w-48', 'w-28'] as const
const DETAIL_WIDTHS = ['w-56', 'w-36', 'w-44', 'w-24'] as const
const SKELETON_EVENTS = 4

/** The timeline while its notes, tasks and invoices load: a day heading and a few events. */
export function ActivityTimelineSkeleton() {
  return (
    <LoadingRegion label="Loading activity" className="space-y-4">
      <SectionHeader icon={HistoryIcon} title="Activity" />
      <div aria-hidden>
        <div className="mb-3 flex h-4 items-center gap-3">
          <SkeletonText size="11px" className="w-16" />
          <span className="h-px flex-1 bg-border" />
        </div>
        <ol>
          {Array.from({ length: SKELETON_EVENTS }, (_, i) => (
            <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
              {i < SKELETON_EVENTS - 1 && <span className="absolute top-9 bottom-1 left-[17px] w-px bg-border" />}
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 pt-1.5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <SkeletonText className={cn('max-w-full', pickWidth(TITLE_WIDTHS, i))} />
                  </div>
                  {i % 2 === 0 && <SkeletonText className="w-14" />}
                </div>
                <SkeletonText size="xs" className={cn('mt-0.5 max-w-full', pickWidth(DETAIL_WIDTHS, i))} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </LoadingRegion>
  )
}

/** Everything that happened to the sale, newest first, grouped by day. */
export function ActivityTimeline({ sale }: { sale: SaleView }) {
  const notes = useSaleNotesQuery(sale.id)
  const tasks = useSaleTasksQuery()
  const invoices = useInvoicesQuery()
  const today = todayInSydney()

  const groups = useMemo(
    () =>
      groupByDay(
        buildTimeline({
          sale,
          notes: notes.data ?? [],
          tasks: (tasks.data ?? []).filter((t) => t.saleId === sale.id),
          invoices: (invoices.data ?? []).filter((i) => i.saleId === sale.id),
        }),
      ),
    [sale, notes.data, tasks.data, invoices.data],
  )

  const failed = [notes, tasks, invoices].find((q) => q.isError)
  if (failed) return <ErrorState error={failed.error} onRetry={() => void failed.refetch()} />
  if (notes.isPending || tasks.isPending || invoices.isPending) return <ActivityTimelineSkeleton />

  return (
    <section aria-label="Activity" className="space-y-4">
      <SectionHeader icon={HistoryIcon} title="Activity" />
      {groups.map((g) => (
        <div key={g.day}>
          <h4 className="mb-3 flex items-center gap-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {dayLabel(g.day, today)}
            <span aria-hidden className="h-px flex-1 bg-border" />
          </h4>
          <ol>
            {g.events.map((e, i) => (
              <EventRow key={e.id} event={e} last={i === g.events.length - 1} />
            ))}
          </ol>
        </div>
      ))}
    </section>
  )
}
