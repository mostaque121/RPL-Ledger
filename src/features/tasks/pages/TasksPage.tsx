import { useMemo } from 'react'
import { ListTodoIcon, PlusIcon, SearchXIcon } from 'lucide-react'
import { FILL_PAGE } from '@/components/data/table-styles'
import type { CustomizerSection } from '@/components/data/ViewCustomizer'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { FilterOption } from '@/components/forms/FilterSelect'
import { PageActions } from '@/components/layout/PageActions'
import { Button } from '@/components/ui/button'
import { useSalesQuery } from '@/features/sales/api/sales'
import { useSaleTasksQuery } from '@/features/sales/api/tasks'
import { useAddDialog } from '@/hooks/use-add-dialog'
import { useViewItems } from '@/hooks/use-view-items'
import { todayInSydney } from '@/lib/format'
import { defaultItems, visibleIds, type ViewItem } from '@/lib/view-prefs'
import { NewTaskDialog } from '../components/NewTaskDialog'
import { TaskGroups, TaskGroupsSkeleton } from '../components/TaskGroups'
import { TasksFilterBar } from '../components/TasksFilterBar'
import { TasksTabs } from '../components/TasksTabs'
import { filterTasks, groupTasks, tabCounts, type TaskFilters, type TaskRow } from '../filters'
import { useTaskFilters } from '../hooks/use-task-filters'
import { effectiveTaskFilters, TASK_FILTER_FIELD, TASK_FILTERS, type TaskFilterId } from '../view'

/** Distinct `{ id, name }` pairs from the tasks' sales, by name. */
function optionsOf(rows: TaskRow[], pick: (r: TaskRow) => [string | null | undefined, string | null | undefined]): FilterOption[] {
  const map = new Map<string, string>()
  for (const r of rows) {
    const [value, label] = pick(r)
    if (value && label) map.set(value, label)
  }
  return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
}

/** Every task across all sales, grouped by urgency, with filters on the fields that matter. */
export function TasksPage() {
  const tasks = useSaleTasksQuery()
  const sales = useSalesQuery()
  const { filters, setFilters } = useTaskFilters()
  // Opens through the URL, so the command box can open it too.
  const [adding, setAdding] = useAddDialog('task')
  const today = todayInSydney()

  // The viewer's filters (shown, hidden, order), remembered in this browser.
  const [filterItems, setFilterItems, resetFilterItems] = useViewItems('tasks:filters', TASK_FILTERS)
  const shownFilters = visibleIds(filterItems)
  const active = effectiveTaskFilters(filters, shownFilters)

  /** Hiding a filter also clears it, so nothing narrows the list unseen. */
  function changeFilterItems(next: ViewItem<TaskFilterId>[]) {
    const cleared: Partial<TaskFilters> = {}
    for (const item of next) if (!item.visible) cleared[TASK_FILTER_FIELD[item.id]] = 'all'
    setFilters(cleared)
    setFilterItems(next)
  }

  const customize: CustomizerSection[] = [
    {
      key: 'filters',
      label: 'Filters',
      defs: TASK_FILTERS,
      items: filterItems,
      onChange: changeFilterItems,
      onReset: () => {
        changeFilterItems(defaultItems(TASK_FILTERS))
        resetFilterItems()
      },
    },
  ]

  const rows = useMemo<TaskRow[] | null>(() => {
    if (!tasks.data || !sales.data) return null
    const byId = new Map(sales.data.map((s) => [s.id, s]))
    return tasks.data.map((t) => {
      const s = t.saleId ? byId.get(t.saleId) : undefined
      return {
        ...t,
        sale: s
          ? {
              sellerId: s.sellerId,
              sellerName: s.sellerName,
              rtoId: s.rtoId,
              rtoName: s.rtoName,
              courseId: s.courseId,
              courseName: s.courseName,
              paymentStatus: s.summary.status,
              cancelled: s.cancelled,
            }
          : null,
      }
    })
  }, [tasks.data, sales.data])

  // A few hundred tasks at most, so filtering on every render is fine.
  const view = (() => {
    if (!rows) return null
    return {
      counts: tabCounts(rows, active, today),
      groups: groupTasks(filterTasks(rows, active, today), today),
      sellers: optionsOf(rows, (r) => [r.sale?.sellerId, r.sale?.sellerName]),
      rtos: optionsOf(rows, (r) => [r.sale?.rtoId, r.sale?.rtoName]),
      courses: optionsOf(rows, (r) => [r.sale?.courseId, r.sale?.courseName]),
    }
  })()

  const failed = tasks.error ?? sales.error
  if (failed) {
    return (
      <ErrorState
        error={failed}
        onRetry={() => {
          void tasks.refetch()
          void sales.refetch()
        }}
      />
    )
  }

  return (
    <>
      <PageActions>
        <Button onClick={() => setAdding(true)} disabled={!sales.data}>
          <PlusIcon />
          <span className="hidden sm:inline">New task</span>
        </Button>
      </PageActions>

      <div className={FILL_PAGE}>
        <TasksTabs value={filters.tab} onChange={(tab) => setFilters({ tab })} counts={view?.counts ?? null} />
        <TasksFilterBar
          filters={filters}
          onChange={setFilters}
          visible={shownFilters}
          sellers={view?.sellers ?? []}
          rtos={view?.rtos ?? []}
          courses={view?.courses ?? []}
          customize={customize}
        />

        {!view ? (
          <TaskGroupsSkeleton />
        ) : rows?.length === 0 ? (
          <EmptyState
            icon={ListTodoIcon}
            title="No tasks yet"
            description="Add to-dos like “Pay the HubSpot bill”, or follow-ups on a sale like “Ask for the USI”."
            action={
              <Button onClick={() => setAdding(true)}>
                <PlusIcon />
                New task
              </Button>
            }
          />
        ) : view.groups.length === 0 ? (
          <EmptyState
            icon={SearchXIcon}
            title={filters.tab === 'open' && view.counts.open === 0 ? 'All tasks are done' : 'No matching tasks'}
            description="Try another tab or filter."
          />
        ) : (
          <TaskGroups groups={view.groups} today={today} />
        )}
      </div>

      {adding && sales.data && <NewTaskDialog onOpenChange={setAdding} sales={sales.data} />}
    </>
  )
}
