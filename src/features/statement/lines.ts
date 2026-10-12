/**
 * Turns a partner's statement detail (from `accounting.ts`) into bank-statement lines:
 * each line is signed (+ money in, − money out) and lists the rows behind it.
 * Only labels and signs are added here; every amount comes from the accounting rules.
 */
import type { Expense } from '@/features/expenses/api'
import type { SaleView } from '@/features/sales/api/sales'
import type { IsoDate, Settings, StatementDetail } from '@/lib/accounting'
import { formatAudShort as formatAud } from '@/lib/format'
import type { Cents } from '@/lib/money'

export type LineKey = 'cashIn' | 'rtoPaid' | 'hold' | 'tax' | 'expenses' | 'employee'

export interface StatementRow {
  id: string
  date: IsoDate | null
  title: string
  detail: string
  /** Signed: what this row adds to (or takes from) the take-home. */
  amount: Cents
  saleId?: string
  expenseId?: string
}

export interface StatementLine {
  key: LineKey
  label: string
  hint: string
  /** Signed contribution to the take-home. */
  amount: Cents
  /** Take-home so far, after this line. */
  balance: Cents
  rows: StatementRow[]
}

const saleDetail = (s: SaleView) => [s.courseName, s.rtoName].filter(Boolean).join(' · ') || 'Sale'

function buildRows(d: StatementDetail<SaleView, Expense>, settings: Settings): Record<LineKey, StatementRow[]> {
  return {
    cashIn: d.cashIn.map((r, i) => ({
      id: `${r.sale.id}-${i}`,
      date: r.paidOn,
      title: r.sale.clientName,
      detail: r.amount < 0 ? 'Refund' : saleDetail(r.sale),
      amount: r.amount,
      saleId: r.sale.id,
    })),
    rtoPaid: d.rtoPaid.map((r, i) => ({
      id: `${r.sale.id}-${i}`,
      date: r.paidOn,
      title: r.sale.clientName,
      detail: r.sale.rtoName ?? 'RTO',
      amount: -r.amount,
      saleId: r.sale.id,
    })),
    hold: d.hold.map((r) => ({
      id: r.sale.id,
      date: null,
      title: r.sale.clientName,
      detail: `Hold ${formatAud(r.start)} → ${formatAud(r.end)}`,
      amount: -r.change,
      saleId: r.sale.id,
    })),
    tax: d.tax.map((r) => ({
      id: r.sale.id,
      date: r.sale.completedOn,
      title: r.sale.clientName,
      detail: `${settings.taxPct}% of profit ${formatAud(r.profit)}`,
      amount: -r.tax,
      saleId: r.sale.id,
    })),
    expenses: d.expenses.map((r) => ({
      id: r.expense.id,
      date: r.expense.spentOn,
      title: r.expense.description ?? r.expense.category,
      detail:
        r.share === r.expense.amountAud
          ? `${r.expense.category} · paid in full`
          : `${r.expense.category} · share of ${formatAud(r.expense.amountAud)}`,
      amount: -r.share,
      expenseId: r.expense.id,
    })),
    employee: d.employee.map((r) => ({
      id: r.sale.id,
      date: r.sale.completedOn,
      title: r.sale.clientName,
      detail: `${r.sale.sellerName} · share of net ${formatAud(r.netProfit)}`,
      amount: r.share,
      saleId: r.sale.id,
    })),
  }
}

export function statementLines(d: StatementDetail<SaleView, Expense>, settings: Settings): StatementLine[] {
  const st = d.statement
  const rows = buildRows(d, settings)
  const holdHint =
    st.holdChange > 0
      ? 'Client money set aside for RTOs this month'
      : st.holdChange < 0
        ? "Last month's held money released"
        : 'No change in money held for RTOs'

  const lines: Omit<StatementLine, 'balance'>[] = [
    { key: 'cashIn', label: 'Client payments received', hint: 'On your own sales, by payment date', amount: st.cashIn, rows: rows.cashIn },
    { key: 'rtoPaid', label: 'Paid to RTOs', hint: 'On your own sales, by payment date', amount: -st.rtoPaid, rows: rows.rtoPaid },
    {
      key: 'hold',
      label: 'Held for RTOs',
      hint: `${holdHint} (${formatAud(st.holdStart)} → ${formatAud(st.holdEnd)})`,
      amount: -st.holdChange,
      rows: rows.hold,
    },
    { key: 'tax', label: `Tax reserve ${settings.taxPct}%`, hint: 'Profit of your own sales completed this month', amount: -st.tax, rows: rows.tax },
    { key: 'expenses', label: 'Share of expenses', hint: 'Expenses dated this month', amount: -st.expenseShare, rows: rows.expenses },
    {
      key: 'employee',
      label: 'Share of employee sales',
      hint: 'Net profit (after tax) of employee sales completed this month',
      amount: st.employeeShare,
      rows: rows.employee,
    },
  ]

  let balance = 0
  return lines.map((line) => {
    balance += line.amount
    return { ...line, balance }
  })
}

