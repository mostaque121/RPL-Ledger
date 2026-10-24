import { useCallback, useMemo, useState } from 'react'
import { BanknoteIcon, PlusIcon, SearchXIcon, WalletIcon } from 'lucide-react'
import { FILL_PAGE } from '@/components/data/table-styles'
import type { CustomizerSection } from '@/components/data/ViewCustomizer'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryView } from '@/components/feedback/QueryView'
import { PageActions } from '@/components/layout/PageActions'
import { Button } from '@/components/ui/button'
import { usePeopleQuery } from '@/features/employees/api'
import { useSettingsQuery } from '@/features/settings/api/settings'
import { useAddDialog } from '@/hooks/use-add-dialog'
import { useViewItems } from '@/hooks/use-view-items'
import { formatAud, formatDate, formatMonth } from '@/lib/format'
import { defaultItems, visibleIds, type ViewItem } from '@/lib/view-prefs'
import { useDeleteExpenseMutation, useExpensesQuery, type Expense } from '../api'
import { ExpenseDialog } from '../components/ExpenseDialog'
import { ExpensesFilterBar } from '../components/ExpensesFilterBar'
import { ExpensesTable, ExpensesTableSkeleton } from '../components/ExpensesTable'
import { SalariesDialog } from '../components/SalariesDialog'
import { filterExpenses, type ExpenseFilters } from '../filters'
import { useExpenseFilters } from '../hooks/use-expense-filters'
import { EXPENSE_COLUMNS, EXPENSE_FILTER_FIELD, EXPENSE_FILTERS, effectiveExpenseFilters, type ExpenseFilterId } from '../view'

export function ExpensesPage() {
  const expenses = useExpensesQuery()
  const settings = useSettingsQuery().data
  const people = usePeopleQuery()
  const remove = useDeleteExpenseMutation()
  const { filters, setFilters } = useExpenseFilters()

  const [editing, setEditing] = useState<Expense | null>(null)
  // New expense / monthly salaries open through the URL, so the command box can open them too.
  const [adding, setAdding] = useAddDialog('expense')
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [paying, setPaying] = useAddDialog('salaries')

  const employeeOptions = useMemo(
    () => (people.data ?? []).filter((p) => p.role === 'employee').map((p) => ({ value: p.id, label: p.name })),
    [people.data],
  )
  // The viewer's columns and filters (shown, hidden, order), remembered in this browser.
  const [columns, setColumns, resetColumns] = useViewItems('expenses:columns', EXPENSE_COLUMNS)
  const [filterItems, setFilterItems, resetFilterItems] = useViewItems('expenses:filters', EXPENSE_FILTERS)
  const shownFilters = visibleIds(filterItems)

  /** Hiding a filter also clears it, so nothing narrows the list unseen. */
  function changeFilterItems(next: ViewItem<ExpenseFilterId>[]) {
    const cleared: Partial<ExpenseFilters> = {}
    for (const item of next) if (!item.visible) cleared[EXPENSE_FILTER_FIELD[item.id]] = 'all'
    setFilters(cleared)
    setFilterItems(next)
  }

  const customize: CustomizerSection[] = [
    { key: 'columns', label: 'Columns', defs: EXPENSE_COLUMNS, items: columns, onChange: setColumns, onReset: resetColumns },
    {
      key: 'filters',
      label: 'Filters',
      defs: EXPENSE_FILTERS,
      items: filterItems,
      onChange: changeFilterItems,
      onReset: () => {
        changeFilterItems(defaultItems(EXPENSE_FILTERS))
        resetFilterItems()
      },
    },
  ]

  // A few hundred rows at most, so filtering on every render is fine.
  const shown = expenses.data ? filterExpenses(expenses.data, effectiveExpenseFilters(filters, shownFilters)) : []
  const period = filters.month === 'all' ? 'All months' : formatMonth(filters.month)
  const onDelete = useCallback((e: Expense) => setDeleting(e), [])

  const filterBar = (
    <ExpensesFilterBar
      filters={filters}
      onChange={setFilters}
      visible={shownFilters}
      employees={employeeOptions}
      settings={settings}
      customize={customize}
    />
  )
  // Search and filters work straight away; only the rows wait for the data.
  const skeleton = (
    <div className={FILL_PAGE}>
      {filterBar}
      <ExpensesTableSkeleton view={columns} />
    </div>
  )

  return (
    <>
      <PageActions>
        <Button variant="outline" onClick={() => setPaying(true)} disabled={!expenses.data}>
          <BanknoteIcon />
          <span className="hidden sm:inline">Monthly salaries</span>
        </Button>
        <Button onClick={() => setAdding(true)} disabled={!settings}>
          <PlusIcon />
          <span className="hidden sm:inline">Add expense</span>
        </Button>
      </PageActions>

      <QueryView query={expenses} loading={skeleton}>
        {(all) =>
          !settings ? (
            skeleton
          ) : all.length === 0 ? (
            <EmptyState
              icon={WalletIcon}
              title="No expenses yet"
              description="Add ads, software, phone and other costs, or add this month's salaries in one click."
              action={
                <Button onClick={() => setAdding(true)}>
                  <PlusIcon />
                  Add expense
                </Button>
              }
            />
          ) : (
            <div className={FILL_PAGE}>
              {filterBar}
              <ExpensesTable
                expenses={shown}
                settings={settings}
                view={columns}
                onEdit={setEditing}
                onDelete={onDelete}
                empty={
                  <EmptyState
                    icon={SearchXIcon}
                    className="border-0 py-12"
                    title={`No matching expenses${filters.month === 'all' ? '' : ` in ${period}`}`}
                    description="Try another month, or clear the filters."
                  />
                }
              />
            </div>
          )
        }
      </QueryView>

      {(editing || adding) && settings && (
        <ExpenseDialog
          open
          onOpenChange={(open) => {
            if (open) return
            if (editing) setEditing(null)
            else setAdding(false)
          }}
          settings={settings}
          expense={editing ?? undefined}
        />
      )}

      {paying && expenses.data && <SalariesDialog open onOpenChange={setPaying} expenses={expenses.data} />}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete the ${formatAud(deleting.amountAud)} ${deleting.category.toLowerCase()} expense?` : ''}
        description={
          deleting &&
          `From ${formatDate(deleting.spentOn)}.${deleting.saleId ? ' Its sale will show the commission as not added.' : ''} This can't be undone.`
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => deleting && remove.mutateAsync(deleting.id)}
      />
    </>
  )
}
