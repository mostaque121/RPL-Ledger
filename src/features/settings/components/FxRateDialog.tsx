import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { MonthPicker } from '@/components/forms/MonthPicker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatMonth, formatRate } from '@/lib/format'
import { rateFor, useUpsertFxRateMutation, type FxRate } from '../api/fx-rates'
import { fxRateSchema, type FxRateValues } from '../schema'

interface FxRateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Prefilled values: the row being edited, or a suggestion for a new one. */
  initial: FxRateValues
  /** Existing rates, to warn before overwriting a month. */
  rates: readonly FxRate[]
  editing?: boolean
}

export function FxRateDialog({ open, onOpenChange, initial, rates, editing = false }: FxRateDialogProps) {
  const save = useUpsertFxRateMutation()
  const form = useForm<FxRateValues>({ resolver: zodResolver(fxRateSchema), values: initial })
  const { errors } = form.formState
  const month = useWatch({ control: form.control, name: 'month' })
  const existing = editing ? null : rateFor(rates, month)

  function submit(values: FxRateValues) {
    save.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{editing ? 'Edit rate' : 'Add AUD → BDT rate'}</DialogTitle>
          <DialogDescription>Taka for 1 Australian dollar. BDT expenses in that month use it.</DialogDescription>
        </DialogHeader>

        <form id="fx-rate-form" onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.month}>
              <FieldLabel htmlFor="fx-month">Month</FieldLabel>
              <Controller
                control={form.control}
                name="month"
                render={({ field }) => (
                  <MonthPicker id="fx-month" value={field.value} onChange={field.onChange} disabled={editing} />
                )}
              />
              {existing !== null && (
                <FieldDescription className="text-warning">
                  {formatMonth(month)} already has {formatRate(existing)}. Saving replaces it.
                </FieldDescription>
              )}
              <FieldError errors={[errors.month]} />
            </Field>
            <Field data-invalid={!!errors.audToBdt}>
              <FieldLabel htmlFor="fx-rate">৳ per A$1</FieldLabel>
              <Input
                id="fx-rate"
                type="number"
                inputMode="decimal"
                step="0.0001"
                autoFocus
                className="money text-right"
                aria-invalid={!!errors.audToBdt}
                {...form.register('audToBdt', { valueAsNumber: true })}
              />
              <FieldError errors={[errors.audToBdt]} />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="fx-rate-form" disabled={save.isPending}>
            {save.isPending && <Loader2Icon className="animate-spin" />}
            Save rate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
