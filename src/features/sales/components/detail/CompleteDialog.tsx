import { useState } from 'react'
import { CircleCheckBigIcon, Loader2Icon, TriangleAlertIcon } from 'lucide-react'
import { DatePicker } from '@/components/forms/DatePicker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { monthOf } from '@/lib/accounting'
import { formatAud, formatBdt, formatMonth, todayInSydney } from '@/lib/format'
import { useAddCommissionMutation } from '../../api/commission'
import { useSetCompletedMutation, type SaleView } from '../../api/sales'
import { useCommissionPlan } from '../../hooks/use-commission-plan'
import { CommissionPlanNote } from './CommissionPlanNote'

interface CompleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: SaleView
}

/** Mark a sale completed on a date. For an employee sale, can add their commission in the same step. */
export function CompleteDialog({ open, onOpenChange, sale }: CompleteDialogProps) {
  const [date, setDate] = useState<string | null>(todayInSydney())
  const [withCommission, setWithCommission] = useState(true)
  const [pending, setPending] = useState(false)
  const complete = useSetCompletedMutation()
  const addCommission = useAddCommissionMutation()
  const plan = useCommissionPlan(sale, date ?? todayInSydney())
  const canAddCommission = plan.kind === 'ready' && !sale.commission
  const { due, rtoDue } = sale.summary

  async function confirm() {
    if (!date) return
    setPending(true)
    try {
      await complete.mutateAsync({ id: sale.id, completedOn: date })
      if (canAddCommission && withCommission && plan.kind === 'ready') {
        await addCommission.mutateAsync({
          saleId: sale.id,
          employeeId: plan.employeeId,
          clientName: sale.clientName,
          bdt: plan.bdt,
          rate: plan.rate,
          spentOn: date,
        })
      }
      onOpenChange(false)
    } catch {
      // already toasted
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <CircleCheckBigIcon className="size-4 text-info" />
            Mark as completed
          </DialogTitle>
          <DialogDescription>
            The profit, tax and split of this sale count in the month you complete it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="complete-date">Completed on</FieldLabel>
            <DatePicker id="complete-date" value={date} onChange={setDate} />
            {date && (
              <p className="text-sm">
                Net profit <span className="money font-bold text-success">{formatAud(sale.summary.netProfit)}</span> counts in{' '}
                <span className="font-bold">{formatMonth(monthOf(date))}</span>.
              </p>
            )}
          </Field>

          {(due > 0 || rtoDue > 0) && (
            <div className="flex gap-2 rounded-lg border border-warning/50 bg-warning/10 px-3 py-2.5 text-sm">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                {due > 0 && (
                  <p>
                    The client still owes <span className="money font-bold">{formatAud(due)}</span>.
                  </p>
                )}
                {rtoDue > 0 && (
                  <p>
                    The RTO is still owed <span className="money font-bold">{formatAud(rtoDue)}</span>.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">You can still complete it; payments can be added later.</p>
              </div>
            </div>
          )}

          {canAddCommission && plan.kind === 'ready' ? (
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Switch id="complete-commission" checked={withCommission} onCheckedChange={setWithCommission} />
              <Label htmlFor="complete-commission" className="block text-sm leading-snug font-normal">
                Also add {plan.employeeName}'s commission{' '}
                <span className="money font-bold">{formatBdt(plan.bdt)}</span>{' '}
                <span className="text-muted-foreground">
                  (≈ <span className="money">{formatAud(plan.aud)}</span>)
                </span>{' '}
                as an expense
              </Label>
            </div>
          ) : (
            !sale.commission && <CommissionPlanNote plan={plan} />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!date || pending} onClick={confirm}>
            {pending && <Loader2Icon className="animate-spin" />}
            Mark completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
