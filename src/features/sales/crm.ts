/** Pure rules for a sale's notes and tasks: due states, labels and ordering. */
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { IsoDate } from '@/lib/accounting'
import { formatDate } from '@/lib/format'

/** How urgent an open task is. `soon` = within the next 7 days. */
export type TaskDue = 'overdue' | 'today' | 'soon' | 'later' | 'none'

export const SOON_DAYS = 7

/** Days from `today` to `dueOn` (negative = overdue). */
const daysUntil = (dueOn: IsoDate, today: IsoDate) => differenceInCalendarDays(parseISO(dueOn), parseISO(today))

export function taskDue(dueOn: IsoDate | null, today: IsoDate): TaskDue {
  if (!dueOn) return 'none'
  const days = daysUntil(dueOn, today)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  return days <= SOON_DAYS ? 'soon' : 'later'
}

/** `3 days overdue`, `Today`, `Tomorrow`, `In 4 days`, then the date. */
export function dueLabel(dueOn: IsoDate, today: IsoDate): string {
  const days = daysUntil(dueOn, today)
  if (days < -1) return `${-days} days overdue`
  if (days === -1) return 'Yesterday'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= SOON_DAYS) return `In ${days} days`
  return formatDate(dueOn)
}

interface TaskLike {
  dueOn: IsoDate | null
  doneAt: string | null
  createdAt: string
}

/** Open tasks first, soonest due first (no date last); then done tasks, most recently done first. */
export function sortTasks<T extends TaskLike>(tasks: readonly T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (!a.doneAt !== !b.doneAt) return a.doneAt ? 1 : -1
    if (a.doneAt && b.doneAt) return b.doneAt.localeCompare(a.doneAt)
    if (a.dueOn !== b.dueOn) {
      if (!a.dueOn) return 1
      if (!b.dueOn) return -1
      return a.dueOn.localeCompare(b.dueOn)
    }
    return a.createdAt.localeCompare(b.createdAt)
  })
}

/** Open tasks that need attention now: overdue or due within the next week. */
export function tasksNeedingAttention<T extends TaskLike>(tasks: readonly T[], today: IsoDate): T[] {
  return sortTasks(tasks.filter((t) => !t.doneAt && ['overdue', 'today', 'soon'].includes(taskDue(t.dueOn, today))))
}

interface NoteLike {
  pinned: boolean
  createdAt: string
}

/** Pinned notes first, then newest first. */
export function sortNotes<T extends NoteLike>(notes: readonly T[]): T[] {
  return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
}
