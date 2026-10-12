import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { DatePicker } from '@/components/forms/DatePicker'
import { MoneyInput } from '@/components/forms/MoneyInput'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatAud, todayInSydney } from '@/lib/format'
import type { Cents } from '@/lib/money'
import { useSavePaymentMutation, type PaymentKind } from '../../api/payments'
import type { RtoPayment } from '../../api/sales'
import { paymentSchema, type PaymentValues } from '../../schema'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: PaymentKind
  saleId: string
  clientName: string
  /** The payment to edit, or undefined to add one. */
  payment?: Partial<RtoPayment> & { id: string }
  /** Prefilled amount for a new payment (what's still owed). */
  suggested: Cents
  /** Agencies used before, offered as suggestions (RTO payments). */
  agencies?: string[]
}

const COPY = {
  client: { add: 'Add payment', edit: 'Edit payment', hint: 'Money received from the client. Use a minus amount for a refund.' },
  rto: { add: 'Pay RTO', edit: 'Edit RTO payment', hint: 'Money paid to the RTO. Use a minus amount if the RTO refunded you.' },
} as const

export function PaymentDialog({ open, onOpenChange, kind, saleId, clientName, payment, suggested, agencies = [] }: PaymentDialogProps) {
  const save = useSavePaymentMutation()
  const copy = COPY[kind]
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paidOn: payment?.paidOn ?? todayInSydney(),
      amount: payment?.amount ?? (suggested > 0 ? suggested : (null as unknown as number)),
      agency: payment?.agency ?? '',
      note: payment?.note ?? '',
    },
  })
  const { errors } = form.formState
  const listId = `agencies-${saleId}`

  function submit(v: PaymentValues) {
    save.mutate(
      {
        kind,
        saleId,
        id: payment?.id,
        paidOn: v.paidOn,
        amount: v.amount,
        note: v.note.trim() || null,
        agency: kind === 'rto' ? v.agency.trim().toUpperCase() || null : undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {payment ? copy.edit : copy.add} — {clientName}
          </DialogTitle>
          <DialogDescription>{copy.hint}</DialogDescription>
        </DialogHeader>

        <form id="payment-form" onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="payment-amount">Amount</FieldLabel>
                <Controller
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <MoneyInput
                      id="payment-amount"
                      autoFocus
                      allowNegative
                      value={field.value ?? null}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-invalid={!!errors.amount}
                    />
                  )}
                />
                {!payment && suggested > 0 && !errors.amount && (
                  <FieldDescription className="text-xs">
                    Still owed: <span className="money">{formatAud(suggested)}</span>
                  </FieldDescription>
                )}
                <FieldError errors={[errors.amount]} />
              </Field>
              <Field data-invalid={!!errors.paidOn}>
                <FieldLabel htmlFor="payment-date">Date</FieldLabel>
                <Controller
                  control={form.control}
                  name="paidOn"
                  render={({ field }) => (
                    <DatePicker id="payment-date" value={field.value} onChange={(d) => field.onChange(d ?? '')} invalid={!!errors.paidOn} />
                  )}
                />
                <FieldError errors={[errors.paidOn]} />
              </Field>
            </div>

            {kind === 'rto' && (
              <Field data-invalid={!!errors.agency}>
                <FieldLabel htmlFor="payment-agency">Agency</FieldLabel>
                <Input id="payment-agency" list={listId} placeholder="OS, OC, NC…" autoComplete="off" className="uppercase" {...form.register('agency')} />
                <datalist id={listId}>
                  {agencies.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
                <FieldError errors={[errors.agency]} />
              </Field>
            )}

            <Field data-invalid={!!errors.note}>
              <FieldLabel htmlFor="payment-note">Note</FieldLabel>
              <Input id="payment-note" autoComplete="off" placeholder="e.g. 2nd instalment, bank transfer" {...form.register('note')} />
              <FieldError errors={[errors.note]} />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="payment-form" disabled={save.isPending}>
            {save.isPending && <Loader2Icon className="animate-spin" />}
            {payment ? 'Save' : copy.add}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
