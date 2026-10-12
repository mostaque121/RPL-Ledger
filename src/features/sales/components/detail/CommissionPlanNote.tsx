import { InfoIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatBdt, formatMonth } from '@/lib/format'
import { SETTINGS_PATHS } from '@/features/settings/config'
import type { CommissionPlan } from '../../hooks/use-commission-plan'

/** Explains why a commission can't be added yet, with a link to fix it. Renders nothing otherwise. */
export function CommissionPlanNote({ plan }: { plan: CommissionPlan }) {
  if (plan.kind !== 'no-commission' && plan.kind !== 'no-rate') return null
  return (
    <p className="flex gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
      <InfoIcon className="mt-0.5 size-4 shrink-0" />
      {plan.kind === 'no-commission' ? (
        <span>
          {plan.employeeName} has no per-sale commission set.{' '}
          <Link to="/employees" className="font-semibold text-primary underline-offset-2 hover:underline">
            Set it on Employees
          </Link>
        </span>
      ) : (
        <span>
          To add {plan.employeeName}'s {formatBdt(plan.bdt)} commission, set the AUD→BDT rate for {formatMonth(plan.month)}.{' '}
          <Link to={SETTINGS_PATHS.fxRates} className="font-semibold text-primary underline-offset-2 hover:underline">
            Open Settings
          </Link>
        </span>
      )}
    </p>
  )
}
