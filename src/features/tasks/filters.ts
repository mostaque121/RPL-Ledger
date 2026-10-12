/** Filtering, counting and grouping for the Tasks page. Pure, so it's tested. */
import type { IsoDate, PaymentStatus } from '@/lib/accounting'
import type { SaleTask } from '@/features/sales/api/tasks'
import { sortTasks, taskDue, type TaskDue } from '@/features/sales/crm'

/** What the Tasks page knows about a task's sale (joined on the client from the sales list). */
export interface TaskSaleInfo {
  sellerId: string
  sellerName: string
  rtoId: string | null
  rtoName: string | null
  courseId: string | null
  courseName: string | null
  paymentStatus: PaymentStatus
  cancelled: boolean
}

export interface TaskRow extends SaleTask {
  /** Null for a general task (no sale). */
  sale: TaskSaleInfo | null
}

/** The page's tabs: open tasks, open ones by urgency, done ones, or everything. */
export const TASK_TABS = ['open', 'overdue', 'today', 'soon', 'done', 'all'] as const
export type TaskTab = (typeof TASK_TABS)[number]

/** Tasks on a sale, or general ones (no sale). */
export type TaskLinkFilter = 'all' | 'sale' | 'general'

export type TaskFilters = {
  tab: TaskTab
  link: TaskLinkFilter
  sellerId: string | 'all'
  rtoId: string | 'all'
  courseId: string | 'all'
  /** Client's payment status; `due` = still owes money (Unpaid or Partial). */
  payment: 'all' | 'due' | PaymentStatus
  search: string
}

export const TASK_DUES = ['overdue', 'today', 'soon', 'later', 'none'] as const satisfies readonly TaskDue[]

export const DUE_LABEL: Record<TaskDue, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  soon: 'This week',
  later: 'Later',
  none: 'No due date',
}

function inTab(t: TaskRow, tab: TaskTab, today: IsoDate): boolean {
  if (tab === 'all') return true
  if (tab === 'done') return !!t.doneAt
  if (t.doneAt) return false
  return tab === 'open' || taskDue(t.dueOn, today) === tab
}

export function filterTasks(rows: readonly TaskRow[], f: TaskFilters, today: IsoDate): TaskRow[] {
  const needle = f.search.trim().toLowerCase()
  return rows.filter((t) => {
    const s = t.sale
    const status = s && !s.cancelled ? s.paymentStatus : null
    return (
      inTab(t, f.tab, today) &&
      (f.link === 'all' || (f.link === 'general') === !t.saleId) &&
      (f.sellerId === 'all' || s?.sellerId === f.sellerId) &&
      (f.rtoId === 'all' || s?.rtoId === f.rtoId) &&
      (f.courseId === 'all' || s?.courseId === f.courseId) &&
      (f.payment === 'all' || (f.payment === 'due' ? status === 'Unpaid' || status === 'Partial' : status === f.payment)) &&
      (!needle || [t.title, t.clientName, s?.courseName, s?.rtoName, s?.sellerName].some((v) => v?.toLowerCase().includes(needle)))
    )
  })
}

/** How many tasks each tab would show, with the other filters applied. */
export function tabCounts(rows: readonly TaskRow[], f: TaskFilters, today: IsoDate): Record<TaskTab, number> {
  const counts = Object.fromEntries(TASK_TABS.map((tab) => [tab, 0])) as Record<TaskTab, number>
  for (const t of filterTasks(rows, { ...f, tab: 'all' }, today)) {
    for (const tab of TASK_TABS) if (inTab(t, tab, today)) counts[tab]++
  }
  return counts
}

export interface TaskGroup {
  key: TaskDue | 'done'
  label: string
  tasks: TaskRow[]
}

/** Open tasks grouped by urgency (most urgent first), then done ones. Empty groups are left out. */
export function groupTasks(rows: readonly TaskRow[], today: IsoDate): TaskGroup[] {
  const sorted = sortTasks(rows)
  const groups: TaskGroup[] = [
    ...TASK_DUES.map((due) => ({
      key: due,
      label: DUE_LABEL[due],
      tasks: sorted.filter((t) => !t.doneAt && taskDue(t.dueOn, today) === due),
    })),
    { key: 'done', label: 'Done', tasks: sorted.filter((t) => t.doneAt) },
  ]
  return groups.filter((g) => g.tasks.length > 0)
}
