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
import { useRefundSaleMutation, type SaleView } from '../../api/sales'
import { refundSchema, type RefundValues } from '../../schema'

interface RefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: SaleView
}

/** Give money back to the client: saves a negative payment and cancels the sale. */
export function RefundDialog({ open, onOpenChange, sale }: RefundDialogProps) {
  const refund = useRefundSaleMutation()
  const collected = sale.summary.collected
  const form = useForm<RefundValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: { paidOn: todayInSydney(), amount: collected > 0 ? collected : (null as unknown as number), note: '' },
  })
  const { errors } = form.formState

  function submit(v: RefundValues) {
    refund.mutate(
      { id: sale.id, paidOn: v.paidOn, amount: v.amount, note: v.note.trim() || 'Refund' },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Refund — {sale.clientName}</DialogTitle>
          <DialogDescription>
            The sale is cancelled and marked Refunded: no profit, due or hold. If the RTO gives money back, add it under
            Pay RTO as a minus amount.
          </DialogDescription>
        </DialogHeader>

        <form id="refund-form" onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="refund-amount">Amount refunded</FieldLabel>
                <Controller
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <MoneyInput
                      id="refund-amount"
                      autoFocus
                      value={field.value ?? null}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-invalid={!!errors.amount}
                    />
                  )}
                />
                {!errors.amount && (
                  <FieldDescription className="text-xs">
                    Received so far: <span className="money">{formatAud(collected)}</span>
                  </FieldDescription>
                )}
                <FieldError errors={[errors.amount]} />
              </Field>
              <Field data-invalid={!!errors.paidOn}>
                <FieldLabel htmlFor="refund-date">Date</FieldLabel>
                <Controller
                  control={form.control}
                  name="paidOn"
                  render={({ field }) => (
                    <DatePicker id="refund-date" value={field.value} onChange={(d) => field.onChange(d ?? '')} invalid={!!errors.paidOn} />
                  )}
                />
                <FieldError errors={[errors.paidOn]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.note}>
              <FieldLabel htmlFor="refund-note">Reason</FieldLabel>
              <Input id="refund-note" autoComplete="off" placeholder="e.g. RTO couldn't issue the certificate" {...form.register('note')} />
              <FieldError errors={[errors.note]} />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="refund-form" variant="destructive" disabled={refund.isPending}>
            {refund.isPending && <Loader2Icon className="animate-spin" />}
            Refund and cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
