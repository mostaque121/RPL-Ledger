import { useCallback, useMemo, useState } from 'react'
import { PlusIcon, UsersIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { MonthPicker } from '@/components/forms/MonthPicker'
import { PageActions } from '@/components/layout/PageActions'
import type { BackState } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useExpensesQuery } from '@/features/expenses/api'
import { useSalesQuery } from '@/features/sales/api/sales'
import { rateFor, useFxRatesQuery } from '@/features/settings/api/fx-rates'
import { useSettingsQuery } from '@/features/settings/api/settings'
import { useAddDialog } from '@/hooks/use-add-dialog'
import { useUrlFilters } from '@/hooks/use-url-filters'
import { currentMonth, formatMonth, todayInSydney } from '@/lib/format'
import { useDeletePersonMutation, usePeopleQuery, useUpdatePersonMutation, type Person } from '../api'
import { EmployeesTable, EmployeesTableSkeleton, type EmployeeRow } from '../components/EmployeesTable'
import { PartnerCards, PartnerCardsSkeleton } from '../components/PartnerCards'
import { PersonDialog } from '../components/PersonDialog'
import { employeeHref } from '../links'
import { rateForMonth } from '../rates'
import { employeeMonth } from '../stats'

const monthDefaults = () => ({ month: currentMonth() })
const monthValidators = { month: (v: string) => /^\d{4}-\d{2}$/.test(v) }

export function EmployeesPage() {
  const people = usePeopleQuery()
  const settings = useSettingsQuery()
  const rates = useFxRatesQuery()
  const sales = useSalesQuery()
  const expenses = useExpensesQuery()
  const update = useUpdatePersonMutation()
  const remove = useDeletePersonMutation()

  const { filters, setFilters } = useUrlFilters(monthDefaults, monthValidators)
  const navigate = useNavigate()
  const { search } = useLocation()
  const [editing, setEditing] = useState<Person | null>(null)
  // A new employee opens through the URL, so the command box can open it too.
  const [adding, setAdding] = useAddDialog('employee')
  const [deleting, setDeleting] = useState<Person | null>(null)
  const [deactivating, setDeactivating] = useState<Person | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const { month } = filters
  const rate = rates.data ? rateFor(rates.data, month) : null
  const shares = { tanvir: settings.data?.tanvirShare ?? 0, md: settings.data?.mdShare ?? 0 }

  const rows = useMemo<EmployeeRow[]>(
    () =>
      (people.data ?? [])
        .filter((p) => p.role === 'employee')
        .map((p) => ({
          ...p,
          stats: sales.data && expenses.data ? employeeMonth(p.id, month, sales.data, expenses.data, p.rates) : null,
          monthPay: rateForMonth(p.rates, month, todayInSydney()),
        })),
    [people.data, sales.data, expenses.data, month],
  )

  const inactiveCount = rows.filter((e) => !e.active).length
  const shown = showInactive ? rows : rows.filter((e) => e.active)

  const reactivate = update.mutate // stable, unlike the mutation object
  const toggleActive = useCallback(
    (person: Person) => {
      if (person.active) setDeactivating(person)
      else reactivate({ id: person.id, active: true })
    },
    [reactivate],
  )
  const openRow = useCallback(
    (row: EmployeeRow) =>
      void navigate(employeeHref(row.id, month), { state: { from: `/employees${search}` } satisfies BackState }),
    [navigate, month, search],
  )

  return (
    <>
      <PageActions>
        <Button onClick={() => setAdding(true)}>
          <PlusIcon />
          <span className="hidden sm:inline">Add employee</span>
        </Button>
      </PageActions>

      {people.isError ? (
        <ErrorState error={people.error} onRetry={() => void people.refetch()} />
      ) : (
        <div className="space-y-6">
          {people.data ? (
            <PartnerCards partners={people.data.filter((p) => p.role === 'partner')} shares={shares} onEdit={setEditing} />
          ) : (
            <PartnerCardsSkeleton />
          )}

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Employees</h2>
                <p className="text-sm text-muted-foreground">
                  Sales, completions and pay for {formatMonth(month)} (the salary paid, or the rate in force that month).
                  Commission owed is all-time, each sale at the rate on its completed date.
                  {rates.data && rate === null && ` No AUD→BDT rate for ${formatMonth(month)}, so AUD estimates are hidden.`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {inactiveCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
                    <Label htmlFor="show-inactive" className="text-sm">
                      Show inactive ({inactiveCount})
                    </Label>
                  </div>
                )}
                <MonthPicker stepper value={month} onChange={(m) => setFilters({ month: m })} />
              </div>
            </div>

            {/* The month's figures need sales and expenses too, so the rows wait for all three. */}
            {!people.data || !sales.data || !expenses.data ? (
              <EmployeesTableSkeleton />
            ) : shown.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title="No employees yet"
                description="Add the people who sell for you, with their salary and per-sale commission."
                action={
                  <Button onClick={() => setAdding(true)}>
                    <PlusIcon />
                    Add employee
                  </Button>
                }
              />
            ) : (
              <EmployeesTable
                employees={shown}
                rate={rate}
                onOpen={openRow}
                onEdit={setEditing}
                onToggleActive={toggleActive}
                onDelete={setDeleting}
              />
            )}
          </section>
        </div>
      )}

      {(editing || adding) && (
        <PersonDialog
          open
          onOpenChange={(isOpen) => {
            if (isOpen) return
            if (editing) setEditing(null)
            else setAdding(false)
          }}
          person={editing ?? undefined}
        />
      )}

      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(isOpen) => !isOpen && setDeactivating(null)}
        title={`Deactivate ${deactivating?.name ?? ''}?`}
        description="Their past sales and expenses stay. They won't get monthly salaries or appear when adding new sales. You can reactivate them any time."
        confirmLabel="Deactivate"
        onConfirm={() => deactivating && update.mutateAsync({ id: deactivating.id, active: false })}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(isOpen) => !isOpen && setDeleting(null)}
        title={`Delete ${deleting?.name ?? ''}?`}
        description="They have no sales or expenses, so nothing else changes. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => deleting && remove.mutateAsync(deleting.id)}
      />
    </>
  )
}
