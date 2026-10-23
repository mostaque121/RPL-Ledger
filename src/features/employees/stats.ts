/**
 * Per-employee figures for the Employees page. Only counts and sums of values the
 * accounting rules already produced (sale summaries, expense amounts); no new money rules.
 */
import { monthOf, profitSplit, type Month, type PartnerAmounts, type Settings } from '@/lib/accounting'
import { addMonths } from '@/lib/month'
import { sumCents, type Cents } from '@/lib/money'
import type { Expense } from '@/features/expenses/api'
import type { SaleView } from '@/features/sales/api/sales'
import { rateOn, type PayRate } from './rates'

export type StatSale = Pick<
  SaleView,
  'id' | 'sellerId' | 'clientName' | 'saleDate' | 'completedOn' | 'cancelled' | 'payments' | 'commission' | 'summary'
>
export type StatExpense = Pick<Expense, 'employeeId' | 'category' | 'spentOn' | 'bdt' | 'amountAud'>

/** A month, or `all` for all time. */
export type Period = Month | 'all'

const inPeriod = (period: Period, date: string) => period === 'all' || monthOf(date) === period

/** Taka (original amount) and A$ (what counts in the accounts) of some expenses. */
export interface Paid {
  count: number
  bdt: number
  aud: Cents
}

const paid = (expenses: readonly StatExpense[]): Paid => ({
  count: expenses.length,
  bdt: expenses.reduce((sum, e) => sum + (e.bdt ?? 0), 0),
  aud: sumCents(expenses, (e) => e.amountAud),
})

const isCompleted = (s: StatSale) => !s.cancelled && s.completedOn !== null

/** Completed sales with no commission expense linked yet. */
export const commissionOwed = <S extends StatSale>(sales: readonly S[]): S[] =>
  sales.filter((s) => isCompleted(s) && !s.commission)

export interface EmployeeMonth {
  month: Month
  /** Sales made in the month (by sale date), not counting cancelled ones. */
  sales: number
  /** Sales completed in the month. */
  completed: number
  /** Company net profit of the sales completed in the month. */
  netProfit: Cents
  salary: Paid
  commission: Paid
}

function monthStats(month: Month, sales: readonly StatSale[], expenses: readonly StatExpense[]): EmployeeMonth {
  const completed = sales.filter((s) => isCompleted(s) && monthOf(s.completedOn!) === month)
  const inMonth = expenses.filter((e) => monthOf(e.spentOn) === month)
  return {
    month,
    sales: sales.filter((s) => !s.cancelled && monthOf(s.saleDate) === month).length,
    completed: completed.length,
    netProfit: sumCents(completed, (s) => s.summary.netProfit),
    salary: paid(inMonth.filter((e) => e.category === 'Salary')),
    commission: paid(inMonth.filter((e) => e.category === 'Employee commission')),
  }
}

const own = <S extends StatSale, E extends StatExpense>(employeeId: string, sales: readonly S[], expenses: readonly E[]) => ({
  sales: sales.filter((s) => s.sellerId === employeeId),
  expenses: expenses.filter((e) => e.employeeId === employeeId),
})

/** One employee's figures for one month, plus their commission still owed (all-time). */
export function employeeMonth(
  employeeId: string,
  month: Month,
  sales: readonly StatSale[],
  expenses: readonly StatExpense[],
  rates: readonly PayRate[] = [],
): EmployeeMonth & { owed: number; owedBdt: number } {
  const mine = own(employeeId, sales, expenses)
  const owed = commissionOwed(mine.sales)
  return { ...monthStats(month, mine.sales, mine.expenses), owed: owed.length, owedBdt: owedBdt(owed, rates) }
}

/** Every month with any sale, completion, salary or commission, newest first. */
export function employeeHistory(
  employeeId: string,
  sales: readonly StatSale[],
  expenses: readonly StatExpense[],
): EmployeeMonth[] {
  const mine = own(employeeId, sales, expenses)
  const months = new Set<Month>()
  for (const s of mine.sales) {
    months.add(monthOf(s.saleDate))
    if (s.completedOn) months.add(monthOf(s.completedOn))
  }
  for (const e of mine.expenses) months.add(monthOf(e.spentOn))
  return [...months].sort().reverse().map((m) => monthStats(m, mine.sales, mine.expenses))
}

export interface EmployeeOverview<S extends StatSale = StatSale> {
  total: number
  open: number
  completed: number
  cancelled: number
  /** Company net profit of all their completed sales. */
  netProfit: Cents
  /** Completed sales still waiting for their commission expense, oldest first. */
  owed: S[]
  commissionPaid: Paid
  salaryPaid: Paid
}

/** All-time figures for one employee. */
export function employeeOverview<S extends StatSale>(
  employeeId: string,
  sales: readonly S[],
  expenses: readonly StatExpense[],
): EmployeeOverview<S> {
  const mine = own(employeeId, sales, expenses)
  const completed = mine.sales.filter(isCompleted)
  return {
    total: mine.sales.length,
    open: mine.sales.filter((s) => !s.cancelled && !s.completedOn).length,
    completed: completed.length,
    cancelled: mine.sales.filter((s) => s.cancelled).length,
    netProfit: sumCents(completed, (s) => s.summary.netProfit),
    owed: commissionOwed(mine.sales).sort((a, b) => a.completedOn!.localeCompare(b.completedOn!)),
    commissionPaid: paid(mine.expenses.filter((e) => e.category === 'Employee commission')),
    salaryPaid: paid(mine.expenses.filter((e) => e.category === 'Salary')),
  }
}

/** Taka still owed for these completed sales, each at the commission in force on its completed date. */
export const owedBdt = (owed: readonly Pick<StatSale, 'completedOn'>[], rates: readonly PayRate[]): number =>
  owed.reduce((sum, s) => sum + (s.completedOn ? (rateOn(rates, s.completedOn)?.commissionPerSaleBdt ?? 0) : 0), 0)

/** A month in the activity chart: the usual figures plus everything paid to them (salary + commission). */
export interface TrendMonth extends EmployeeMonth {
  pay: Cents
}

/** The `count` months ending with `end`, oldest first, including months with no activity. */
export function employeeTrend(
  employeeId: string,
  end: Month,
  sales: readonly StatSale[],
  expenses: readonly StatExpense[],
  count = 12,
): TrendMonth[] {
  const mine = own(employeeId, sales, expenses)
  return Array.from({ length: count }, (_, i) => {
    const m = monthStats(addMonths(end, i - count + 1), mine.sales, mine.expenses)
    return { ...m, pay: m.salary.aud + m.commission.aud }
  })
}

export interface EmployeePeriod<S extends StatSale, E extends StatExpense> {
  /** Sales made in the period (by sale date), cancelled ones included. */
  sold: S[]
  /** Not-cancelled sales completed in the period. */
  completed: S[]
  /** Company net profit (after tax) of `completed`. */
  netProfit: Cents
  /** How that net profit splits between the partners, sale by sale. */
  share: PartnerAmounts
  /** Their salary and commission expenses in the period, newest first. */
  payments: E[]
  salary: Paid
  commission: Paid
  /** Salary + commission in A$. */
  pay: Cents
  /** Salary + commission in taka (BDT expenses only). */
  payBdt: number
  /** Net profit brought in minus what they were paid. */
  afterPay: Cents
}

/** One employee's figures for a month, or for all time. */
export function employeePeriod<S extends StatSale, E extends StatExpense>(
  employeeId: string,
  period: Period,
  sales: readonly S[],
  expenses: readonly E[],
  settings: Settings,
): EmployeePeriod<S, E> {
  const mine = own(employeeId, sales, expenses)
  const completed = mine.sales.filter((s) => isCompleted(s) && inPeriod(period, s.completedOn!))
  const payments = mine.expenses
    .filter((e) => (e.category === 'Salary' || e.category === 'Employee commission') && inPeriod(period, e.spentOn))
    .sort((a, b) => b.spentOn.localeCompare(a.spentOn))
  const share: PartnerAmounts = { tanvir: 0, md: 0 }
  for (const s of completed) {
    const part = profitSplit('employee', s.summary.netProfit, settings)
    share.tanvir += part.tanvir
    share.md += part.md
  }
  const netProfit = sumCents(completed, (s) => s.summary.netProfit)
  const salary = paid(payments.filter((e) => e.category === 'Salary'))
  const commission = paid(payments.filter((e) => e.category === 'Employee commission'))
  const pay = salary.aud + commission.aud
  return {
    sold: mine.sales.filter((s) => inPeriod(period, s.saleDate)),
    completed,
    netProfit,
    share,
    payments,
    salary,
    commission,
    pay,
    payBdt: salary.bdt + commission.bdt,
    afterPay: netProfit - pay,
  }
}
