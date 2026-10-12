/** Pure rules for a sale's activity timeline: every event that happened to it, newest first. */
import type { IsoDate } from '@/lib/accounting'
import { todayInSydney } from '@/lib/format'
import type { Cents } from '@/lib/money'

interface EventBase {
  id: string
  /** The day it happened (Sydney). */
  day: IsoDate
  /** Exact time when known (notes, tasks, invoices); payments only have a date. */
  at: string | null
}

export type TimelineEvent = EventBase &
  (
    | { kind: 'created'; seller: string; fee: Cents }
    | { kind: 'payment'; amount: Cents; note: string | null }
    | { kind: 'rto-payment'; amount: Cents; agency: string | null; note: string | null }
    | { kind: 'paid-in-full' }
    | { kind: 'completed' }
    | { kind: 'commission'; aud: Cents; bdt: number | null }
    | { kind: 'invoice'; number: string; version: number; total: Cents }
    | { kind: 'note'; body: string; pinned: boolean }
    | { kind: 'task-added'; title: string; dueOn: IsoDate | null }
    | { kind: 'task-done'; title: string }
  )

export type TimelineKind = TimelineEvent['kind']

export interface TimelineInput {
  sale: {
    id: string
    saleDate: IsoDate
    sellerName: string
    courseFee: Cents
    completedOn: IsoDate | null
    cancelled: boolean
    payments: readonly { id: string; paidOn: IsoDate; amount: Cents; note: string | null }[]
    rtoPayments: readonly { id: string; paidOn: IsoDate; amount: Cents; agency: string | null; note: string | null }[]
    commission: { id: string; spentOn: IsoDate; aud: Cents; bdt: number | null } | null
    summary: { fullyPaidOn: IsoDate | null }
  }
  notes: readonly { id: string; body: string; pinned: boolean; createdAt: string }[]
  tasks: readonly { id: string; title: string; dueOn: IsoDate | null; doneAt: string | null; createdAt: string }[]
  invoices: readonly { id: string; number: string; versions: readonly { id: string; version: number; createdAt: string; totals: { total: Cents } }[] }[]
}

/**
 * Within one day, events with only a date have no time, so they keep a fixed story order
 * (created → payments → paid in full → completed) and sit below the timed events of that day.
 */
const DATE_ONLY_RANK: Partial<Record<TimelineKind, number>> = {
  created: 0,
  payment: 1,
  'rto-payment': 1,
  commission: 1,
  'paid-in-full': 2,
  completed: 3,
}

const sydneyDay = (timestamp: string): IsoDate => todayInSydney(new Date(timestamp))

function newestFirst(a: TimelineEvent, b: TimelineEvent): number {
  if (a.day !== b.day) return b.day.localeCompare(a.day)
  if (a.at && b.at) return b.at.localeCompare(a.at)
  if (a.at || b.at) return a.at ? -1 : 1
  return (DATE_ONLY_RANK[b.kind] ?? 0) - (DATE_ONLY_RANK[a.kind] ?? 0)
}

export function buildTimeline({ sale, notes, tasks, invoices }: TimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { id: `created-${sale.id}`, day: sale.saleDate, at: null, kind: 'created', seller: sale.sellerName, fee: sale.courseFee },
  ]

  for (const p of sale.payments)
    events.push({ id: `pay-${p.id}`, day: p.paidOn, at: null, kind: 'payment', amount: p.amount, note: p.note })
  for (const p of sale.rtoPayments)
    events.push({ id: `rto-${p.id}`, day: p.paidOn, at: null, kind: 'rto-payment', amount: p.amount, agency: p.agency, note: p.note })

  if (sale.summary.fullyPaidOn && !sale.cancelled)
    events.push({ id: `paid-${sale.id}`, day: sale.summary.fullyPaidOn, at: null, kind: 'paid-in-full' })
  if (sale.completedOn) events.push({ id: `done-${sale.id}`, day: sale.completedOn, at: null, kind: 'completed' })
  if (sale.commission) {
    const c = sale.commission
    events.push({ id: `comm-${c.id}`, day: c.spentOn, at: null, kind: 'commission', aud: c.aud, bdt: c.bdt })
  }

  for (const inv of invoices)
    for (const v of inv.versions)
      events.push({
        id: `inv-${v.id}`,
        day: sydneyDay(v.createdAt),
        at: v.createdAt,
        kind: 'invoice',
        number: inv.number,
        version: v.version,
        total: v.totals.total,
      })

  for (const n of notes)
    events.push({ id: `note-${n.id}`, day: sydneyDay(n.createdAt), at: n.createdAt, kind: 'note', body: n.body, pinned: n.pinned })

  for (const t of tasks) {
    events.push({ id: `task-${t.id}`, day: sydneyDay(t.createdAt), at: t.createdAt, kind: 'task-added', title: t.title, dueOn: t.dueOn })
    if (t.doneAt) events.push({ id: `taskdone-${t.id}`, day: sydneyDay(t.doneAt), at: t.doneAt, kind: 'task-done', title: t.title })
  }

  return events.sort(newestFirst)
}

/** Consecutive events of the same day, keeping the timeline's order. */
export function groupByDay(events: readonly TimelineEvent[]): { day: IsoDate; events: TimelineEvent[] }[] {
  const groups: { day: IsoDate; events: TimelineEvent[] }[] = []
  for (const e of events) {
    const last = groups[groups.length - 1]
    if (last?.day === e.day) last.events.push(e)
    else groups.push({ day: e.day, events: [e] })
  }
  return groups
}
