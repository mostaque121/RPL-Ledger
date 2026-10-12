import { BadgePercentIcon, CircleCheckIcon, Loader2Icon, PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { saleHref } from '@/features/sales/links'
import { Button } from '@/components/ui/button'
import type { FxRate } from '@/features/settings/api/fx-rates'
import { useAddCommissionMutation, useAddCommissionsMutation, type CommissionInput } from '@/features/sales/api/commission'
import type { SaleView } from '@/features/sales/api/sales'
import { CommissionPlanNote } from '@/features/sales/components/detail/CommissionPlanNote'
import { commissionPlan } from '@/features/sales/hooks/use-commission-plan'
import { formatAud, formatBdt, formatDate, formatMonth } from '@/lib/format'
import { sumCents } from '@/lib/money'
import { SETTINGS_PATHS } from '@/features/settings/config'
import type { Person } from '../../api'
import { owedBdt } from '../../stats'

interface CommissionOwedListProps {
  employee: Person
  /** Completed sales without a commission expense, oldest first. */
  owed: SaleView[]
  people: Person[]
  rates: FxRate[]
}

/** Completed sales still waiting for the employee's commission, with "add" for one or all. */
export function CommissionOwedList({ employee, owed, people, rates }: CommissionOwedListProps) {
  const addOne = useAddCommissionMutation()
  const addAll = useAddCommissionsMutation()
  const pending = addOne.isPending || addAll.isPending

  const planned = owed.map((sale) => ({ sale, plan: commissionPlan(sale, sale.completedOn!, people, rates) }))
  const inputs: CommissionInput[] = planned.flatMap(({ sale, plan }) =>
    plan.kind === 'ready'
      ? [{ saleId: sale.id, employeeId: plan.employeeId, clientName: sale.clientName, bdt: plan.bdt, rate: plan.rate, spentOn: plan.spentOn }]
      : [],
  )
  const totalAud = sumCents(planned, ({ plan }) => (plan.kind === 'ready' ? plan.aud : 0))
  const noCommission = planned.find((p) => p.plan.kind === 'no-commission')?.plan

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <BadgePercentIcon className="size-4 text-primary" />
          Commission owed
          {owed.length > 0 && (
            <span className="money text-warning-foreground dark:text-warning">
              {formatBdt(owedBdt(owed, employee.rates))}
            </span>
          )}
        </h3>
        {inputs.length > 1 && (
          <Button size="sm" disabled={pending} onClick={() => addAll.mutate(inputs)}>
            {addAll.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
            Add all {inputs.length}
            <span className="money opacity-80">≈ {formatAud(totalAud)}</span>
          </Button>
        )}
      </div>

      {owed.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
          <CircleCheckIcon className="size-4 text-success" />
          Every completed sale has its commission added.
        </p>
      ) : (
        <>
          {noCommission && <CommissionPlanNote plan={noCommission} />}
          <ul className="divide-y rounded-lg border">
            {planned.map(({ sale, plan }) => (
              <li key={sale.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <Link
                    to={saleHref(sale.id)}
                    className="block truncate font-semibold underline-offset-2 hover:underline"
                  >
                    {sale.clientName}
                  </Link>
                  <p className="text-xs text-muted-foreground">Completed {formatDate(sale.completedOn)}</p>
                </div>
                {plan.kind === 'ready' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      addOne.mutate({
                        saleId: sale.id,
                        employeeId: plan.employeeId,
                        clientName: sale.clientName,
                        bdt: plan.bdt,
                        rate: plan.rate,
                        spentOn: plan.spentOn,
                      })
                    }
                  >
                    <PlusIcon />
                    <span className="money">{formatBdt(plan.bdt)}</span>
                  </Button>
                ) : plan.kind === 'no-rate' ? (
                  <Link to={SETTINGS_PATHS.fxRates} className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
                    Set {formatMonth(plan.month)} rate
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
