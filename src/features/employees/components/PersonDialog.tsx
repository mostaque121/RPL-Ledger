import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { DatePicker } from '@/components/forms/DatePicker'
import { MoneyInput } from '@/components/forms/MoneyInput'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatBdt, formatDate, todayInSydney } from '@/lib/format'
import { fromCents, toCents } from '@/lib/money'
import { useCreateEmployeeMutation, useSetPayMutation, useUpdatePersonMutation, type Person } from '../api'
import { rateOn } from '../rates'
import { personSchema, type PersonValues } from '../schema'

interface PersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The person to edit, or undefined to add a new employee. */
  person?: Person
}

// The form holds BDT as poisha (MoneyInput's minor units); the API takes whole taka.
const toPoisha = (taka: number | null) => (taka === null ? null : toCents(taka))
const toTaka = (poisha: number | null) => (poisha === null ? null : fromCents(poisha))

/** Add or edit an employee. For a partner only the name can change. A pay change is recorded from a date. */
export function PersonDialog({ open, onOpenChange, person }: PersonDialogProps) {
  const create = useCreateEmployeeMutation()
  const update = useUpdatePersonMutation()
  const setPay = useSetPayMutation()
  const pending = create.isPending || update.isPending || setPay.isPending
  const isPartner = person?.role === 'partner'

  const form = useForm<PersonValues>({
    resolver: zodResolver(personSchema),
    values: {
      name: person?.name ?? '',
      salaryBdt: toPoisha(person?.salaryBdt ?? null),
      commissionPerSaleBdt: toPoisha(person?.commissionPerSaleBdt ?? null),
      effectiveFrom: todayInSydney(),
    },
  })
  const { errors } = form.formState
  const [salary, commission, effectiveFrom] = useWatch({ control: form.control, name: ['salaryBdt', 'commissionPerSaleBdt', 'effectiveFrom'] })

  // The pay already in force on the chosen date: only a real change adds a row to the history.
  const before = person && effectiveFrom ? rateOn(person.rates, effectiveFrom) : null
  const payChanged =
    !!person &&
    !isPartner &&
    (toTaka(salary) !== (before?.salaryBdt ?? null) || toTaka(commission) !== (before?.commissionPerSaleBdt ?? null))

  async function submit(values: PersonValues) {
    const pay = {
      salaryBdt: toTaka(values.salaryBdt),
      commissionPerSaleBdt: toTaka(values.commissionPerSaleBdt),
      effectiveFrom: values.effectiveFrom,
    }
    try {
      if (!person) {
        await create.mutateAsync({ name: values.name, ...pay })
      } else {
        if (values.name.trim() !== person.name) await update.mutateAsync({ id: person.id, name: values.name })
        if (payChanged) await setPay.mutateAsync({ personId: person.id, ...pay })
      }
      onOpenChange(false)
    } catch {
      // The mutation already showed the error; keep the dialog open.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {person ? `Edit ${person.name}` : 'Add employee'}
          </DialogTitle>
          <DialogDescription>
            {isPartner
              ? 'Partners are matched by their role, so renaming is safe.'
              : person
                ? 'A pay change starts on the date you pick. Earlier months and sales keep the old pay.'
                : 'Salary and commission are paid in taka and recorded as expenses.'}
          </DialogDescription>
        </DialogHeader>

        <form id="person-form" onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="person-name">Name</FieldLabel>
              <Input id="person-name" autoFocus autoComplete="off" aria-invalid={!!errors.name} {...form.register('name')} />
              <FieldError errors={[errors.name]} />
            </Field>

            {!isPartner && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.salaryBdt}>
                  <FieldLabel htmlFor="person-salary">Monthly salary</FieldLabel>
                  <Controller
                    control={form.control}
                    name="salaryBdt"
                    render={({ field }) => (
                      <MoneyInput
                        id="person-salary"
                        currency="BDT"
                        placeholder="0"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        aria-invalid={!!errors.salaryBdt}
                      />
                    )}
                  />
                  <FieldDescription className="text-xs">Leave empty if none.</FieldDescription>
                  <FieldError errors={[errors.salaryBdt]} />
                </Field>
                <Field data-invalid={!!errors.commissionPerSaleBdt}>
                  <FieldLabel htmlFor="person-commission">Commission per sale</FieldLabel>
                  <Controller
                    control={form.control}
                    name="commissionPerSaleBdt"
                    render={({ field }) => (
                      <MoneyInput
                        id="person-commission"
                        currency="BDT"
                        placeholder="0"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        aria-invalid={!!errors.commissionPerSaleBdt}
                      />
                    )}
                  />
                  <FieldDescription className="text-xs">Per completed sale.</FieldDescription>
                  <FieldError errors={[errors.commissionPerSaleBdt]} />
                </Field>
              </div>
            )}

            {/* New employees: when pay starts. Edits: only once the pay actually changes. */}
            {!isPartner && (!person || payChanged) && (
              <Field data-invalid={!!errors.effectiveFrom}>
                <FieldLabel htmlFor="person-pay-from">{person ? 'New pay starts' : 'Pay starts'}</FieldLabel>
                <Controller
                  control={form.control}
                  name="effectiveFrom"
                  render={({ field }) => (
                    <DatePicker id="person-pay-from" value={field.value || null} onChange={(d) => field.onChange(d ?? '')} invalid={!!errors.effectiveFrom} />
                  )}
                />
                <FieldDescription className="text-xs">
                  {person && before
                    ? `Pay on ${formatDate(effectiveFrom)} until now: ${before.salaryBdt !== null ? formatBdt(before.salaryBdt) : 'no'} salary, ${before.commissionPerSaleBdt !== null ? formatBdt(before.commissionPerSaleBdt) : 'no'} per sale.`
                    : 'Sales and months before this date use it too, until a change is recorded.'}
                </FieldDescription>
                <FieldError errors={[errors.effectiveFrom]} />
              </Field>
            )}
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="person-form" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            {person ? 'Save' : 'Add employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
