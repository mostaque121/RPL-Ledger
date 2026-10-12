import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LinkIcon, Loader2Icon } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { saleHref } from '@/features/sales/links'
import { Combobox } from '@/components/forms/Combobox'
import { DatePicker } from '@/components/forms/DatePicker'
import { MoneyInput } from '@/components/forms/MoneyInput'
import { Segmented } from '@/components/forms/Segmented'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePeopleQuery } from '@/features/employees/api'
import { rateOn } from '@/features/employees/rates'
import { rateFor, useFxRatesQuery } from '@/features/settings/api/fx-rates'
import { bdtToAud, type Settings } from '@/lib/accounting'
import { formatAud, formatMonth, formatRate, todayInSydney } from '@/lib/format'
import { toCents } from '@/lib/money'
import { monthOfDate } from '@/lib/month'
import type { Currency, ExpenseCategory } from '@/types/db'
import { SETTINGS_PATHS } from '@/features/settings/config'
import { useSaveExpenseMutation, type Expense } from '../api'
import { EMPLOYEE_CATEGORIES, EXPENSE_CATEGORIES, expenseSchema, type ExpenseValues } from '../schema'
import { SplitPicker } from './SplitPicker'

interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  /** The expense to edit, or undefined to add one. */
  expense?: Expense
}

const PLACEHOLDER: Partial<Record<ExpenseCategory, string>> = {
  Ads: 'e.g. Meta ads, Google ads',
  Software: 'e.g. HubSpot',
  Phone: 'e.g. Jet phone',
  'Lead cost': 'e.g. 20 leads from …',
}

const isEmployeeCategory = (c: ExpenseCategory | undefined) => !!c && EMPLOYEE_CATEGORIES.includes(c)

/** Add or edit an expense. BDT fills in that month's rate; employee categories prefill salary / commission. */
export function ExpenseDialog({ open, onOpenChange, settings, expense }: ExpenseDialogProps) {
  const people = usePeopleQuery()
  const rates = useFxRatesQuery()
  const save = useSaveExpenseMutation()
  // Once the rate is typed by hand (or comes from a saved expense), stop auto-filling it.
  const [rateTouched, setRateTouched] = useState(!!expense)

  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      spentOn: expense?.spentOn ?? todayInSydney(),
      category: expense?.category,
      description: expense?.description ?? '',
      currency: expense?.currency ?? 'AUD',
      amount: expense ? (expense.bdt !== null ? toCents(expense.bdt) : expense.amountAud) : undefined,
      fxRate: expense?.fxRate ?? null,
      employeeId: expense?.employeeId ?? '',
      split: expense?.split ?? 'shared',
    },
  })
  const { errors } = form.formState
  const [spentOn, category, currency, amount, fxRate] = useWatch({
    control: form.control,
    name: ['spentOn', 'category', 'currency', 'amount', 'fxRate'],
  })

  const employees = useMemo(
    () => (people.data ?? []).filter((p) => p.role === 'employee' && (p.active || p.id === expense?.employeeId)),
    [people.data, expense?.employeeId],
  )
  const monthRate = rates.data && spentOn ? rateFor(rates.data, monthOfDate(spentOn)) : null
  const validRate = typeof fxRate === 'number' && Number.isFinite(fxRate) && fxRate > 0 ? fxRate : null
  const amountAud =
    amount == null ? null : currency === 'AUD' ? amount : validRate ? bdtToAud(amount / 100, validRate) : null

  /** Fill the rate for the month of `date`, unless it was typed by hand. */
  function autoRate(date: string) {
    if (rateTouched || !rates.data) return
    form.setValue('fxRate', rateFor(rates.data, monthOfDate(date)) ?? Number.NaN)
  }

  function setCurrency(next: Currency) {
    form.setValue('currency', next)
    if (next === 'BDT') autoRate(form.getValues('spentOn'))
  }

  function onCategory(next: ExpenseCategory) {
    form.setValue('category', next, { shouldValidate: form.formState.isSubmitted })
    if (isEmployeeCategory(next) && form.getValues('amount') == null) setCurrency('BDT')
  }

  /** Picking an employee for an empty salary / commission fills in their usual amount (in taka). */
  function onEmployee(id: string) {
    form.setValue('employeeId', id)
    const person = employees.find((p) => p.id === id)
    // Their pay as it stood on the expense's date.
    const pay = person && rateOn(person.rates, form.getValues('spentOn') || todayInSydney())
    const usual = form.getValues('category') === 'Salary' ? pay?.salaryBdt : pay?.commissionPerSaleBdt
    if (usual && form.getValues('amount') == null) {
      setCurrency('BDT')
      form.setValue('amount', toCents(usual))
    }
  }

  function submit(v: ExpenseValues) {
    save.mutate(
      {
        id: expense?.id,
        spentOn: v.spentOn,
        category: v.category,
        description: v.description.trim() || null,
        currency: v.currency,
        amount: v.amount,
        fxRate: v.currency === 'BDT' ? v.fxRate : null,
        employeeId: isEmployeeCategory(v.category) ? v.employeeId || null : null,
        split: v.split,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{expense ? 'Edit expense' : 'Add expense'}</DialogTitle>
          <DialogDescription>Amounts are kept in AUD. A taka amount is converted at the month's rate.</DialogDescription>
        </DialogHeader>

        {expense?.saleId && (
          <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            <LinkIcon className="size-4 text-primary" />
            <span>
              Commission for the sale to{' '}
              <Link
                to={saleHref(expense.saleId)}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {expense.saleClientName ?? 'a client'}
              </Link>
            </span>
          </p>
        )}

        <form id="expense-form" onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.category}>
                <FieldLabel htmlFor="expense-category">Category</FieldLabel>
                <Select value={category ?? ''} onValueChange={(v) => onCategory(v as ExpenseCategory)}>
                  <SelectTrigger id="expense-category" className="w-full" aria-invalid={!!errors.category}>
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.category]} />
              </Field>
              <Field data-invalid={!!errors.spentOn}>
                <FieldLabel htmlFor="expense-date">Date</FieldLabel>
                <Controller
                  control={form.control}
                  name="spentOn"
                  render={({ field }) => (
                    <DatePicker
                      id="expense-date"
                      value={field.value}
                      onChange={(d) => {
                        field.onChange(d ?? '')
                        if (d && form.getValues('currency') === 'BDT') autoRate(d)
                      }}
                      invalid={!!errors.spentOn}
                    />
                  )}
                />
                <FieldError errors={[errors.spentOn]} />
              </Field>
            </div>

            {isEmployeeCategory(category) && (
              <Field>
                <FieldLabel htmlFor="expense-employee">Employee</FieldLabel>
                <Controller
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <Combobox
                      id="expense-employee"
                      value={field.value || null}
                      onChange={(id) => (id ? onEmployee(id) : field.onChange(''))}
                      options={employees.map((p) => ({ value: p.id, label: p.name }))}
                      placeholder="Who was paid?"
                      clearable
                    />
                  )}
                />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
              <Field>
                <FieldLabel htmlFor="expense-currency">Paid in</FieldLabel>
                <Segmented
                  id="expense-currency"
                  aria-label="Currency"
                  value={currency}
                  onChange={setCurrency}
                  options={[
                    { value: 'AUD', label: 'AUD' },
                    { value: 'BDT', label: 'BDT' },
                  ]}
                />
              </Field>
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="expense-amount">Amount</FieldLabel>
                <Controller
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <MoneyInput
                      id="expense-amount"
                      currency={currency}
                      value={field.value ?? null}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-invalid={!!errors.amount}
                    />
                  )}
                />
                <FieldError errors={[errors.amount]} />
              </Field>
            </div>

            {currency === 'BDT' && (
              <Field data-invalid={!!errors.fxRate}>
                <FieldLabel htmlFor="expense-rate">Rate (৳ per A$1)</FieldLabel>
                <Input
                  id="expense-rate"
                  type="number"
                  inputMode="decimal"
                  step="0.0001"
                  className="money"
                  aria-invalid={!!errors.fxRate}
                  {...form.register('fxRate', { valueAsNumber: true, onChange: () => setRateTouched(true) })}
                />
                <FieldDescription className="text-xs">
                  {amountAud !== null && (
                    <>
                      = <span className="money font-bold text-foreground">{formatAud(amountAud)}</span>
                      {' · '}
                    </>
                  )}
                  {monthRate !== null ? (
                    <>
                      {formatMonth(monthOfDate(spentOn))} rate is <span className="money">{formatRate(monthRate)}</span>
                      {rateTouched && validRate !== monthRate && (
                        <>
                          {' '}
                          <button
                            type="button"
                            className="font-semibold text-primary underline-offset-2 hover:underline"
                            onClick={() => {
                              setRateTouched(false)
                              form.setValue('fxRate', monthRate, { shouldValidate: true })
                            }}
                          >
                            Use it
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      No rate set for {spentOn ? formatMonth(monthOfDate(spentOn)) : 'this month'}.{' '}
                      <Link to={SETTINGS_PATHS.fxRates} className="font-semibold text-primary underline-offset-2 hover:underline">
                        Add it in Settings
                      </Link>{' '}
                      or type one here.
                    </>
                  )}
                </FieldDescription>
                <FieldError errors={[errors.fxRate]} />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="expense-split">Who pays</FieldLabel>
              <Controller
                control={form.control}
                name="split"
                render={({ field }) => (
                  <SplitPicker id="expense-split" value={field.value} onChange={field.onChange} settings={settings} amountAud={amountAud} />
                )}
              />
            </Field>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="expense-description">Description</FieldLabel>
              <Input
                id="expense-description"
                autoComplete="off"
                placeholder={(category && PLACEHOLDER[category]) ?? 'What was it for?'}
                {...form.register('description')}
              />
              <FieldError errors={[errors.description]} />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form" disabled={save.isPending}>
            {save.isPending && <Loader2Icon className="animate-spin" />}
            {expense ? 'Save' : 'Add expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
