/** Filters the viewer can show, hide and reorder on the Tasks page (saved per browser, see `useViewItems`). */
import type { ViewItemDef } from '@/lib/view-prefs'
import type { TaskFilters } from './filters'

export type TaskFilterId = 'link' | 'seller' | 'rto' | 'course' | 'payment'

export const TASK_FILTERS: readonly ViewItemDef<TaskFilterId>[] = [
  { id: 'link', label: 'Type (sale or general)', defaultVisible: true },
  { id: 'seller', label: 'Seller', defaultVisible: true },
  { id: 'rto', label: 'RTO', defaultVisible: true },
  { id: 'course', label: 'Course', defaultVisible: true },
  { id: 'payment', label: 'Client payment', defaultVisible: true },
]

/** The URL field each filter sets. */
export const TASK_FILTER_FIELD = {
  link: 'link',
  seller: 'sellerId',
  rto: 'rtoId',
  course: 'courseId',
  payment: 'payment',
} as const satisfies Record<TaskFilterId, keyof TaskFilters>

/** A hidden filter doesn't narrow the list, whatever the URL says. */
export function effectiveTaskFilters(filters: TaskFilters, visible: readonly TaskFilterId[]): TaskFilters {
  const next = { ...filters }
  for (const id of Object.keys(TASK_FILTER_FIELD) as TaskFilterId[]) {
    if (!visible.includes(id)) next[TASK_FILTER_FIELD[id]] = 'all'
  }
  return next
}
