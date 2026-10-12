import { FilterToolbar } from '@/components/data/FilterToolbar'
import type { CustomizerSection } from '@/components/data/ViewCustomizer'
import type { FilterOption } from '@/components/forms/FilterSelect'
import type { TaskFilters } from '../filters'
import { TASK_FILTER_FIELD, type TaskFilterId } from '../view'

interface TasksFilterBarProps {
  filters: TaskFilters
  onChange: (patch: Partial<TaskFilters>) => void
  /** The filters the viewer chose to show, in their order. */
  visible: readonly TaskFilterId[]
  sellers: FilterOption[]
  rtos: FilterOption[]
  courses: FilterOption[]
  customize: CustomizerSection[]
}

const STATIC_OPTIONS = {
  link: [
    { value: 'sale', label: 'Sale tasks' },
    { value: 'general', label: 'General' },
  ],
  payment: [
    { value: 'due', label: 'Owes money' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Partial', label: 'Partial' },
    { value: 'Paid', label: 'Paid' },
  ],
} as const satisfies Partial<Record<TaskFilterId, readonly FilterOption[]>>

/** Short labels on the filter chips (the customizer uses the longer ones). */
const SHORT_LABEL: Record<TaskFilterId, string> = {
  link: 'Type',
  seller: 'Seller',
  rto: 'RTO',
  course: 'Course',
  payment: 'Client pay',
}

const CLEARED = Object.fromEntries(Object.values(TASK_FILTER_FIELD).map((f) => [f, 'all'])) as Partial<TaskFilters>

/** Above the task list: search, filters and "Customize" (see `FilterToolbar`). */
export function TasksFilterBar({ filters, onChange, visible, sellers, rtos, courses, customize }: TasksFilterBarProps) {
  const options: Record<TaskFilterId, readonly FilterOption[]> = { ...STATIC_OPTIONS, seller: sellers, rto: rtos, course: courses }

  return (
    <FilterToolbar
      storageKey="tasks"
      search={filters.search}
      onSearch={(search) => onChange({ search })}
      searchPlaceholder="Search task, client, course…"
      searchLabel="Search tasks"
      filters={visible.map((id) => ({
        id,
        label: SHORT_LABEL[id],
        value: filters[TASK_FILTER_FIELD[id]],
        options: options[id],
        onChange: (value) => onChange({ [TASK_FILTER_FIELD[id]]: value }),
      }))}
      onClear={() => onChange(CLEARED)}
      customize={customize}
    />
  )
}
