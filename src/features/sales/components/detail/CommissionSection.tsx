import { useState } from 'react'
import { BadgePercentIcon, Trash2Icon } from 'lucide-react'
import { AddButton, LIST_CARD, SectionEmpty, SectionHeader } from '@/components/data/Section'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { formatAudShort, formatBdt, formatDate, todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAddCommissionMutation, useRemoveCommissionMutation } from '../../api/commission'
import type { SaleView } from '../../api/sales'
import { useCommissionPlan } from '../../hooks/use-commission-plan'
import { CommissionPlanNote } from './CommissionPlanNote'

/** The employee's per-sale commission for this sale: added (as an expense) or ready to add. */
export function CommissionSection({ sale }: { sale: SaleView }) {
  const plan = useCommissionPlan(sale, sale.completedOn ?? todayInSydney())
  const add = useAddCommissionMutation()
  const remove = useRemoveCommissionMutation()
  const [removing, setRemoving] = useState(false)
  const { commission } = sale

  if (plan.kind === 'not-employee') return null

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={BadgePercentIcon}
        title={`${sale.sellerName}'s commission`}
        action={
          !commission &&
          !sale.cancelled &&
          sale.completedOn &&
          plan.kind === 'ready' && (
            <AddButton
              disabled={add.isPending}
              onClick={() =>
                add.mutate({
                  saleId: sale.id,
                  employeeId: plan.employeeId,
                  clientName: sale.clientName,
                  bdt: plan.bdt,
                  rate: plan.rate,
                  spentOn: plan.spentOn,
                })
              }
            >
              Add <span className="money">{formatBdt(plan.bdt)}</span>
            </AddButton>
          )
        }
      />

      {commission ? (
        <div className={cn('flex items-center gap-3', LIST_CARD)}>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Added to expenses on {formatDate(commission.spentOn)}</p>
            <p className="text-xs text-muted-foreground">Split between the partners like other shared expenses.</p>
          </div>
          <div className="text-right">
            {commission.bdt !== null && <p className="money text-base font-bold">{formatBdt(commission.bdt)}</p>}
            <p className="money text-xs text-danger">{formatAudShort(commission.aud)}</p>
          </div>
          <Button variant="ghost" size="icon-sm" className="hover:text-danger" aria-label="Remove commission expense" onClick={() => setRemoving(true)}>
            <Trash2Icon />
          </Button>
        </div>
      ) : sale.cancelled ? (
        <SectionEmpty>No commission on a cancelled sale.</SectionEmpty>
      ) : !sale.completedOn ? (
        <SectionEmpty>You'll be offered to add it when the sale is completed.</SectionEmpty>
      ) : plan.kind === 'ready' ? (
        <SectionEmpty>
          Not added yet: <span className="money font-semibold text-foreground">{formatBdt(plan.bdt)}</span> ≈{' '}
          <span className="money">{formatAudShort(plan.aud)}</span>
        </SectionEmpty>
      ) : (
        <CommissionPlanNote plan={plan} />
      )}

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title="Remove the commission expense?"
        description="Only do this if it wasn't actually paid. The expense is deleted."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => commission && remove.mutateAsync(commission.id)}
      />
    </section>
  )
}
