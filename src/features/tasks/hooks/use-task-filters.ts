import { oneOf, useUrlFilters } from '@/hooks/use-url-filters'
import { TASK_TABS, type TaskFilters } from '../filters'

const defaults = (): TaskFilters => ({
  tab: 'open',
  link: 'all',
  sellerId: 'all',
  rtoId: 'all',
  courseId: 'all',
  payment: 'all',
  search: '',
})

const validators = {
  tab: oneOf(TASK_TABS),
  link: oneOf(['all', 'sale', 'general']),
  payment: oneOf(['all', 'due', 'Paid', 'Partial', 'Unpaid']),
}

/** Task filters in the URL, e.g. `/tasks?tab=overdue&sellerId=<id>`. Open tasks by default. */
export const useTaskFilters = () => useUrlFilters(defaults, validators)
