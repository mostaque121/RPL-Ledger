/**
 * RPL Ledger accounting rules. This is the only place money is calculated.
 * Pure functions, no I/O. All amounts are integer cents (see `money.ts`).
 * Dates are ISO `yyyy-MM-dd` strings and months are `yyyy-MM` strings, so they compare as text.
 * The rules are written out in CLAUDE.md → "Accounting rules".
 */
import {
  percentOf,
  roundHalfAwayFromZero,
  splitByPercent,
  sumCents,
  type Cents,
} from './money'

// ---------------------------------------------------------------- types

export type PartnerKey = 'tanvir' | 'md'
/** Who made a sale, from the accounting point of view. */
export type SellerKind = PartnerKey | 'employee'
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid'
export type ExpenseSplit = 'shared' | 'tanvir' | 'md'
/** `yyyy-MM-dd` */
export type IsoDate = string
/** `yyyy-MM` */
export type Month = string

export interface Settings {
  taxPct: number
  /** Tanvir's share of shared items. MD gets the rest. */
  tanvirShare: number
}

export interface MoneyEntry {
  paidOn: IsoDate
  amount: Cents
}

export interface SaleInput {
  saleDate: IsoDate
  seller: SellerKind
  courseFee: Cents
  rtoCost: Cents
  referralCommission: Cents
  completedOn: IsoDate | null
  cancelled: boolean
  payments: readonly MoneyEntry[]
  rtoPayments: readonly MoneyEntry[]
}

export interface ExpenseInput {
  spentOn: IsoDate
  amountAud: Cents
  split: ExpenseSplit
}

export interface PartnerAmounts {
  tanvir: Cents
  md: Cents
}

// ---------------------------------------------------------------- dates

export const monthOf = (date: IsoDate): Month => date.slice(0, 7)

export function previousMonth(month: Month): Month {
  const [y, m] = month.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

/** True when `date` is on or before the last day of `month`. */
const onOrBeforeMonthEnd = (date: IsoDate, month: Month) => monthOf(date) <= month

// ---------------------------------------------------------------- per sale

/** The parts of a sale that don't depend on payments. */
export function saleProfit(
  sale: Pick<SaleInput, 'courseFee' | 'rtoCost' | 'referralCommission'>,
  settings: Pick<Settings, 'taxPct'>,
) {
  const profit = sale.courseFee - sale.rtoCost - sale.referralCommission
  const tax = percentOf(profit, settings.taxPct)
  return { profit, tax, netProfit: profit - tax }
}

/** Hold = client money received that still belongs to the RTO. */
export function holdAmount(collected: Cents, rtoCost: Cents, rtoPaid: Cents): Cents {
  return Math.max(0, Math.min(collected, rtoCost) - rtoPaid)
}

/**
 * The date the running total of payments first reached the fee and stayed there.
 * Refunds (negative payments) that drop it below the fee clear the date again.
 */
export function fullyPaidOn(fee: Cents, payments: readonly MoneyEntry[]): IsoDate | null {
  const ordered = [...payments].sort((a, b) => a.paidOn.localeCompare(b.paidOn))
  let running = 0
  let reachedOn: IsoDate | null = null
  for (const p of ordered) {
    running += p.amount
    if (running >= fee) reachedOn ??= p.paidOn
    else reachedOn = null
  }
  return reachedOn
}

export interface SaleSummary {
  collected: Cents
  due: Cents
  status: PaymentStatus
  profit: Cents
  tax: Cents
  netProfit: Cents
  rtoPaid: Cents
  rtoDue: Cents
  hold: Cents
  fullyPaidOn: IsoDate | null
  isCompleted: boolean
  /** Month the profit is recognised in (the completed month), or null. */
  profitMonth: Month | null
}

/**
 * Everything about one sale. Pass `asOfMonth` to see the sale as it stood
 * at the end of that month (only payments up to then count).
 */
export function saleSummary(sale: SaleInput, settings: Settings, asOfMonth?: Month): SaleSummary {
  const upTo = (e: MoneyEntry) => !asOfMonth || onOrBeforeMonthEnd(e.paidOn, asOfMonth)
  const payments = sale.payments.filter(upTo)
  const rtoPayments = sale.rtoPayments.filter(upTo)

  const collected = sumCents(payments, (p) => p.amount)
  const rtoPaid = sumCents(rtoPayments, (p) => p.amount)
  const { profit, tax, netProfit } = saleProfit(sale, settings)
  const isCompleted =
    !sale.cancelled &&
    sale.completedOn !== null &&
    (!asOfMonth || onOrBeforeMonthEnd(sale.completedOn, asOfMonth))

  const due = sale.cancelled ? 0 : sale.courseFee - collected
  const status: PaymentStatus = due <= 0 ? 'Paid' : collected > 0 ? 'Partial' : 'Unpaid'

  return {
    collected,
    due,
    status,
    profit: sale.cancelled ? 0 : profit,
    tax: sale.cancelled ? 0 : tax,
    netProfit: sale.cancelled ? 0 : netProfit,
    rtoPaid,
    rtoDue: sale.cancelled ? 0 : sale.rtoCost - rtoPaid,
    hold: sale.cancelled ? 0 : holdAmount(collected, sale.rtoCost, rtoPaid),
    fullyPaidOn: fullyPaidOn(sale.courseFee, payments),
    isCompleted,
    profitMonth: isCompleted && sale.completedOn ? monthOf(sale.completedOn) : null,
  }
}

// ---------------------------------------------------------------- who gets what

/** Net profit of one sale, split between the partners by who sold it. */
export function profitSplit(seller: SellerKind, netProfit: Cents, settings: Settings): PartnerAmounts {
  if (seller === 'tanvir') return { tanvir: netProfit, md: 0 }
  if (seller === 'md') return { tanvir: 0, md: netProfit }
  const [tanvir, md] = splitByPercent(netProfit, settings.tanvirShare)
  return { tanvir, md }
}

export function expenseSplit(expense: Pick<ExpenseInput, 'amountAud' | 'split'>, settings: Settings): PartnerAmounts {
  if (expense.split === 'tanvir') return { tanvir: expense.amountAud, md: 0 }
  if (expense.split === 'md') return { tanvir: 0, md: expense.amountAud }
  const [tanvir, md] = splitByPercent(expense.amountAud, settings.tanvirShare)
  return { tanvir, md }
}

/** Each expense is split by itself and then summed, so every line can be checked. */
export function expensesSplit(expenses: readonly ExpenseInput[], settings: Settings): PartnerAmounts {
  const total: PartnerAmounts = { tanvir: 0, md: 0 }
  for (const e of expenses) {
    const part = expenseSplit(e, settings)
    total.tanvir += part.tanvir
    total.md += part.md
  }
  return total
}

/** BDT amount (whole taka, may have decimals) → AUD cents at `audToBdt` taka per dollar. */
export function bdtToAud(bdt: number, audToBdt: number): Cents {
  if (audToBdt <= 0) throw new Error('FX rate must be greater than 0')
  return roundHalfAwayFromZero((bdt * 100) / audToBdt)
}

/** Several taka amounts in AUD, each converted (and rounded) on its own, as the DB stores them. */
export function sumBdtAsAud(amounts: readonly number[], audToBdtRate: number): Cents {
  return sumCents(amounts, (bdt) => bdtToAud(bdt, audToBdtRate))
}

/** AUD cents → BDT (whole taka) for display. */
export function audToBdt(aud: Cents, audToBdtRate: number): number {
  return Math.round((aud / 100) * audToBdtRate)
}

// ---------------------------------------------------------------- monthly views

const completedIn = (sale: SaleInput, month: Month) =>
  !sale.cancelled && sale.completedOn !== null && monthOf(sale.completedOn) === month

const inMonth = (date: IsoDate, month: Month) => monthOf(date) === month

/** The partner's share of the net profit of employee sales completed in the month. */
export function employeeShare(partner: PartnerKey, month: Month, sales: readonly SaleInput[], settings: Settings): Cents {
  return sumCents(
    sales.filter((s) => s.seller === 'employee' && completedIn(s, month)),
    (s) => profitSplit('employee', saleProfit(s, settings).netProfit, settings)[partner],
  )
}

export interface PartnerStatement {
  partner: PartnerKey
  month: Month
  cashIn: Cents
  rtoPaid: Cents
  holdStart: Cents
  holdEnd: Cents
  /** holdEnd − holdStart. Positive = more client money set aside for RTOs. */
  holdChange: Cents
  tax: Cents
  expenseShare: Cents
  employeeShare: Cents
  takeHome: Cents
}

/** The rows behind each line of a partner's statement. `S` / `E` are the caller's own sale / expense objects. */
export interface StatementDetail<S extends SaleInput = SaleInput, E extends ExpenseInput = ExpenseInput> {
  statement: PartnerStatement
  /** Client payments (and refunds) dated in the month, on the partner's own sales. */
  cashIn: { sale: S; paidOn: IsoDate; amount: Cents }[]
  /** RTO payments dated in the month, on the partner's own sales. */
  rtoPaid: { sale: S; paidOn: IsoDate; amount: Cents }[]
  /** Own sales whose hold changed during the month. */
  hold: { sale: S; start: Cents; end: Cents; change: Cents }[]
  /** Own sales completed in the month. */
  tax: { sale: S; profit: Cents; tax: Cents }[]
  /** Expenses dated in the month that the partner pays part of. */
  expenses: { expense: E; share: Cents }[]
  /** Employee sales completed in the month. */
  employee: { sale: S; netProfit: Cents; share: Cents }[]
}

/**
 * Cash take-home for one partner in one month, with every row behind each line:
 * take_home = cash_in − rto_paid − (hold_end − hold_start) − tax − expense_share + employee_share
 */
export function monthlyStatementDetail<S extends SaleInput, E extends ExpenseInput>(
  partner: PartnerKey,
  month: Month,
  sales: readonly S[],
  expenses: readonly E[],
  settings: Settings,
): StatementDetail<S, E> {
  const own = sales.filter((s) => s.seller === partner)
  const prev = previousMonth(month)

  const cashInRows = own.flatMap((sale) =>
    sale.payments.filter((p) => inMonth(p.paidOn, month)).map((p) => ({ sale, paidOn: p.paidOn, amount: p.amount })),
  )
  const rtoPaidRows = own.flatMap((sale) =>
    sale.rtoPayments.filter((p) => inMonth(p.paidOn, month)).map((p) => ({ sale, paidOn: p.paidOn, amount: p.amount })),
  )
  const holdRows = own.map((sale) => {
    const start = saleSummary(sale, settings, prev).hold
    const end = saleSummary(sale, settings, month).hold
    return { sale, start, end, change: end - start }
  })
  const taxRows = own
    .filter((s) => completedIn(s, month))
    .map((sale) => {
      const { profit, tax } = saleProfit(sale, settings)
      return { sale, profit, tax }
    })
  const expenseRows = expenses
    .filter((e) => inMonth(e.spentOn, month))
    .map((expense) => ({ expense, share: expenseSplit(expense, settings)[partner] }))
    .filter((r) => r.share !== 0)
  const employeeRows = sales
    .filter((s) => s.seller === 'employee' && completedIn(s, month))
    .map((sale) => {
      const { netProfit } = saleProfit(sale, settings)
      return { sale, netProfit, share: profitSplit('employee', netProfit, settings)[partner] }
    })

  const cashIn = sumCents(cashInRows, (r) => r.amount)
  const rtoPaid = sumCents(rtoPaidRows, (r) => r.amount)
  const holdStart = sumCents(holdRows, (r) => r.start)
  const holdEnd = sumCents(holdRows, (r) => r.end)
  const holdChange = holdEnd - holdStart
  const tax = sumCents(taxRows, (r) => r.tax)
  const expenseShare = sumCents(expenseRows, (r) => r.share)
  const empShare = sumCents(employeeRows, (r) => r.share)

  return {
    statement: {
      partner,
      month,
      cashIn,
      rtoPaid,
      holdStart,
      holdEnd,
      holdChange,
      tax,
      expenseShare,
      employeeShare: empShare,
      takeHome: cashIn - rtoPaid - holdChange - tax - expenseShare + empShare,
    },
    cashIn: cashInRows,
    rtoPaid: rtoPaidRows,
    hold: holdRows.filter((r) => r.change !== 0),
    tax: taxRows,
    expenses: expenseRows,
    employee: employeeRows,
  }
}

/** Cash take-home for one partner in one month (see `monthlyStatementDetail`). */
export function monthlyStatement(
  partner: PartnerKey,
  month: Month,
  sales: readonly SaleInput[],
  expenses: readonly ExpenseInput[],
  settings: Settings,
): PartnerStatement {
  return monthlyStatementDetail(partner, month, sales, expenses, settings).statement
}

export interface ProfitView {
  month: Month
  /** All sale profit completed in the month − all expenses in the month (before tax). */
  companyProfit: Cents
  salesProfit: Cents
  expenses: Cents
  /** Net profit of own sales + employee share − expense share. */
  partnerProfit: PartnerAmounts
}

export function profitView(
  month: Month,
  sales: readonly SaleInput[],
  expenses: readonly ExpenseInput[],
  settings: Settings,
): ProfitView {
  const completed = sales.filter((s) => completedIn(s, month))
  const monthExpenses = expenses.filter((e) => inMonth(e.spentOn, month))
  const salesProfit = sumCents(completed, (s) => saleProfit(s, settings).profit)
  const expenseTotal = sumCents(monthExpenses, (e) => e.amountAud)
  const expShare = expensesSplit(monthExpenses, settings)

  const partnerProfit = (p: PartnerKey): Cents =>
    sumCents(
      completed.filter((s) => s.seller === p),
      (s) => saleProfit(s, settings).netProfit,
    ) +
    employeeShare(p, month, sales, settings) -
    expShare[p]

  return {
    month,
    companyProfit: salesProfit - expenseTotal,
    salesProfit,
    expenses: expenseTotal,
    partnerProfit: { tanvir: partnerProfit('tanvir'), md: partnerProfit('md') },
  }
}

// ---------------------------------------------------------------- lists

export interface SalesTotals {
  courseFee: Cents
  rtoCost: Cents
  referralCommission: Cents
  collected: Cents
  due: Cents
  rtoDue: Cents
  hold: Cents
  /** Before tax. */
  profit: Cents
  netProfit: Cents
}

/** Column totals for a list of sales. Cancelled sales add only the cash they collected. */
export function salesTotals(
  rows: readonly { courseFee: Cents; rtoCost: Cents; referralCommission: Cents; cancelled: boolean; summary: SaleSummary }[],
): SalesTotals {
  const live = rows.filter((r) => !r.cancelled)
  return {
    courseFee: sumCents(live, (r) => r.courseFee),
    rtoCost: sumCents(live, (r) => r.rtoCost),
    referralCommission: sumCents(live, (r) => r.referralCommission),
    collected: sumCents(rows, (r) => r.summary.collected),
    due: sumCents(live, (r) => Math.max(0, r.summary.due)),
    rtoDue: sumCents(live, (r) => Math.max(0, r.summary.rtoDue)),
    hold: sumCents(live, (r) => r.summary.hold),
    profit: sumCents(live, (r) => r.summary.profit),
    netProfit: sumCents(live, (r) => r.summary.netProfit),
  }
}

export interface ExpenseTotals<C extends string> {
  total: Cents
  /** Each partner's share, split expense by expense. */
  split: PartnerAmounts
  /** Biggest category first. */
  byCategory: { category: C; amount: Cents }[]
}

/** Totals for a list of expenses (usually one month's). */
export function expenseTotals<C extends string>(
  expenses: readonly (ExpenseInput & { category: C })[],
  settings: Settings,
): ExpenseTotals<C> {
  const byCategory = new Map<C, Cents>()
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amountAud)
  return {
    total: sumCents(expenses, (e) => e.amountAud),
    split: expensesSplit(expenses, settings),
    byCategory: [...byCategory.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
  }
}

// ---------------------------------------------------------------- dashboard

export interface CompanyMonth {
  month: Month
  /** All client payments dated in the month, every seller. */
  cashIn: Cents
  /** All RTO payments dated in the month. */
  rtoPaid: Cents
  expenses: Cents
  /** Profit of sales completed in the month (before tax). */
  salesProfit: Cents
  /** salesProfit − expenses. */
  companyProfit: Cents
  /** Client money still owed at the end of the month (overpayments don't offset it). */
  dues: Cents
  /** Client money held for RTOs at the end of the month. */
  hold: Cents
  takeHome: PartnerAmounts
}

/** The company's figures for one month, as they stood at its end. */
export function companyMonth(
  month: Month,
  sales: readonly SaleInput[],
  expenses: readonly ExpenseInput[],
  settings: Settings,
): CompanyMonth {
  const pv = profitView(month, sales, expenses, settings)
  const asOf = sales.map((s) => ({ made: monthOf(s.saleDate) <= month, summary: saleSummary(s, settings, month) }))
  const dated = (entries: readonly MoneyEntry[]) => sumCents(entries.filter((e) => inMonth(e.paidOn, month)), (e) => e.amount)
  return {
    month,
    cashIn: sumCents(sales, (s) => dated(s.payments)),
    rtoPaid: sumCents(sales, (s) => dated(s.rtoPayments)),
    expenses: pv.expenses,
    salesProfit: pv.salesProfit,
    companyProfit: pv.companyProfit,
    // A sale dated after the month owes nothing yet, but money already received for it is held
    // (the same hold the partner statements use).
    dues: sumCents(asOf, (s) => (s.made ? Math.max(0, s.summary.due) : 0)),
    hold: sumCents(asOf, (s) => s.summary.hold),
    takeHome: {
      tanvir: monthlyStatement('tanvir', month, sales, expenses, settings).takeHome,
      md: monthlyStatement('md', month, sales, expenses, settings).takeHome,
    },
  }
}

export interface ProfitGroup<K> {
  key: K
  count: number
  profit: Cents
  netProfit: Cents
}

/**
 * Profit of sales completed between two months (inclusive), grouped by `keyOf`
 * (e.g. course or RTO). Biggest profit first.
 */
export function profitByGroup<S extends SaleInput, K>(
  sales: readonly S[],
  keyOf: (sale: S) => K,
  from: Month,
  to: Month,
  settings: Settings,
): ProfitGroup<K>[] {
  const groups = new Map<K, ProfitGroup<K>>()
  for (const sale of sales) {
    if (sale.cancelled || !sale.completedOn) continue
    const m = monthOf(sale.completedOn)
    if (m < from || m > to) continue
    const key = keyOf(sale)
    const g = groups.get(key) ?? { key, count: 0, profit: 0, netProfit: 0 }
    const p = saleProfit(sale, settings)
    g.count += 1
    g.profit += p.profit
    g.netProfit += p.netProfit
    groups.set(key, g)
  }
  return [...groups.values()].sort((a, b) => b.profit - a.profit)
}

// ---------------------------------------------------------------- invoices

export interface InvoiceLine {
  quantity: number
  unitPrice: Cents
}

export interface InvoiceTotals {
  total: Cents
  /** The GST inside `total` (1/11 of it) when prices include GST, otherwise 0. */
  gst: Cents
  paid: Cents
  /** Never below 0. */
  due: Cents
}

export const invoiceLineAmount = (line: InvoiceLine): Cents => line.quantity * line.unitPrice

/** Invoice prices are GST-inclusive (10%), so the GST is 1/11 of the total. */
export function invoiceTotals(lines: readonly InvoiceLine[], amountPaid: Cents, gstIncluded: boolean): InvoiceTotals {
  const total = sumCents(lines, invoiceLineAmount)
  return {
    total,
    gst: gstIncluded ? roundHalfAwayFromZero(total / 11) : 0,
    paid: amountPaid,
    due: Math.max(0, total - amountPaid),
  }
}
