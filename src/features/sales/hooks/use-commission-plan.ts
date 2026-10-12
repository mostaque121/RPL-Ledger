import type { Person } from '@/features/employees/api'
import { usePeopleQuery } from '@/features/employees/api'
import { rateOn } from '@/features/employees/rates'
import { rateFor, useFxRatesQuery, type FxRate } from '@/features/settings/api/fx-rates'
import { bdtToAud, monthOf, type IsoDate, type Month } from '@/lib/accounting'
import type { Cents } from '@/lib/money'
import type { Sale } from '../api/sales'

/** What adding the seller's commission for a sale would look like, or why it can't be added yet. */
export type CommissionPlan =
  | { kind: 'not-employee' }
  | { kind: 'loading' }
  | { kind: 'no-commission'; employeeName: string }
  | { kind: 'no-rate'; employeeName: string; bdt: number; month: Month }
  | { kind: 'ready'; employeeId: string; employeeName: string; bdt: number; rate: number; aud: Cents; spentOn: IsoDate }

/** Pure version, for planning many sales at once. `spentOn` is the date the expense is booked on. */
export function commissionPlan(
  sale: Pick<Sale, 'seller' | 'sellerId'>,
  spentOn: IsoDate,
  people: readonly Person[],
  rates: readonly FxRate[],
): CommissionPlan {
  if (sale.seller !== 'employee') return { kind: 'not-employee' }

  const employee = people.find((p) => p.id === sale.sellerId)
  const employeeName = employee?.name ?? 'The seller'
  // The commission in force on that date, not today's (pay can change; see employee rates).
  const bdt = (employee && rateOn(employee.rates, spentOn)?.commissionPerSaleBdt) ?? 0
  if (!employee || bdt <= 0) return { kind: 'no-commission', employeeName }

  const month = monthOf(spentOn)
  const rate = rateFor(rates, month)
  if (rate === null) return { kind: 'no-rate', employeeName, bdt, month }

  return { kind: 'ready', employeeId: employee.id, employeeName, bdt, rate, aud: bdtToAud(bdt, rate), spentOn }
}

/** `spentOn` is the date the commission expense is booked on (normally the completed date). */
export function useCommissionPlan(sale: Pick<Sale, 'seller' | 'sellerId'>, spentOn: IsoDate): CommissionPlan {
  const people = usePeopleQuery()
  const rates = useFxRatesQuery()
  if (sale.seller !== 'employee') return { kind: 'not-employee' }
  if (!people.data || !rates.data) return { kind: 'loading' }
  return commissionPlan(sale, spentOn, people.data, rates.data)
}
