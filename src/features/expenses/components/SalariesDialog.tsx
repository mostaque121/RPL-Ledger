import { useState } from 'react'
import { CheckIcon, Loader2Icon, TriangleAlertIcon } from 'lucide-react'
import { Link } from 'react-router'
import { DatePicker } from '@/components/forms/DatePicker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { usePeopleQuery } from '@/features/employees/api'
import { rateFor, useFxRatesQuery } from '@/features/settings/api/fx-rates'
import { bdtToAud, monthOf, sumBdtAsAud } from '@/lib/accounting'
import { formatAud, formatBdt, formatMonth, formatRate, todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { rateOn } from '@/features/employees/rates'
import { SETTINGS_PATHS } from '@/features/settings/config'
import { useAddMonthlySalariesMutation, type Expense } from '../api'

interface SalariesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenses: Expense[]
}

/**
 * Preview, then one RPC call that adds a Salary expense (BDT, shared) for every active employee
 * with a salary who isn't already paid that month. The preview mirrors the RPC's rules.
 */
export function SalariesDialog({ open, onOpenChange, expenses }: SalariesDialogProps) {
  const [date, setDate] = useState<string | null>(todayInSydney())
  const people = usePeopleQuery()
  const rates = useFxRatesQuery()
  const add = useAddMonthlySalariesMutation()

  const month = monthOf(date ?? todayInSydney())
  const rate = rates.data ? rateFor(rates.data, month) : null
  // Each salary as it stood on the pay date, like the RPC (`employee_rate_on`).
  const payDate = date ?? todayInSydney()
  const rows = (people.data ?? [])
    .filter((p) => p.role === 'employee' && p.active)
    .map((p) => ({ person: p, bdt: rateOn(p.rates, payDate)?.salaryBdt ?? 0 }))
    .filter((r) => r.bdt > 0)
    .map(({ person: p, bdt }) => ({
      id: p.id,
      name: p.name,
      bdt,
      paid: expenses.some((e) => e.category === 'Salary' && e.employeeId === p.id && monthOf(e.spentOn) === month),
    }))
  const toAdd = rows.filter((r) => !r.paid)
  const totalAud = rate ? sumBdtAsAud(toAdd.map((r) => r.bdt), rate) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Add monthly salaries</DialogTitle>
          <DialogDescription>
            One Salary expense per active employee, in taka at the month's rate, shared between the partners.
            Anyone already paid that month is skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="salaries-date">Pay date</FieldLabel>
            <DatePicker id="salaries-date" value={date} onChange={setDate} />
            {rate !== null ? (
              <p className="text-xs text-muted-foreground">
                {formatMonth(month)} rate: <span className="money font-semibold text-foreground">{formatRate(rate)}</span> ৳ per A$1
              </p>
            ) : (
              <p className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                <span>
                  No AUD→BDT rate for {formatMonth(month)}.{' '}
                  <Link to={SETTINGS_PATHS.fxRates} className="font-semibold text-primary underline-offset-2 hover:underline">
                    Add it in Settings
                  </Link>{' '}
                  first.
                </span>
              </p>
            )}
          </Field>

          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
              No active employee has a salary set.{' '}
              <Link to="/employees" className="font-semibold text-primary underline-offset-2 hover:underline">
                Set salaries
              </Link>
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {rows.map((r) => (
                <li key={r.id} className={cn('flex items-center gap-3 px-3 py-2 text-sm', r.paid && 'text-muted-foreground')}>
                  <span className="flex-1 font-medium">{r.name}</span>
                  {r.paid ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-success">
                      <CheckIcon className="size-3.5" />
                      Already paid
                    </span>
                  ) : (
                    <span className="text-right leading-tight">
                      <span className="money block font-bold">{formatBdt(r.bdt)}</span>
                      {rate !== null && (
                        <span className="money block text-[11px] text-muted-foreground">≈ {formatAud(bdtToAud(r.bdt, rate))}</span>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {totalAud !== null && toAdd.length > 0 && (
            <p className="flex justify-between text-sm font-semibold">
              <span>Total to add</span>
              <span className="money text-danger">{formatAud(totalAud)}</span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!date || rate === null || toAdd.length === 0 || add.isPending}
            onClick={() => date && add.mutate(date, { onSuccess: () => onOpenChange(false) })}
          >
            {add.isPending && <Loader2Icon className="animate-spin" />}
            {toAdd.length === 0 ? 'Nothing to add' : `Add ${toAdd.length} salar${toAdd.length === 1 ? 'y' : 'ies'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
