import type { Month, ProfitView } from '@/lib/accounting'
import { formatDate, formatMonth } from '@/lib/format'
import { fromCents, type Cents } from '@/lib/money'
import type { StatementLine } from './lines'

export interface PartnerExport {
  name: string
  lines: StatementLine[]
  takeHome: Cents
}

type Cell = string | number | null

export interface SheetData {
  name: string
  rows: Cell[][]
  /** Column widths in characters. */
  widths: number[]
}

const money = (cents: Cents) => fromCents(cents)

/** The workbook as plain rows: a summary sheet, then one detail sheet per partner. Numbers are A$. */
export function statementSheets(month: Month, partners: PartnerExport[], profit: ProfitView): SheetData[] {
  const title = `Monthly statement — ${formatMonth(month)}`
  const lineKeys = partners[0]?.lines.map((l) => l.key) ?? []

  const summary: Cell[][] = [
    ['RPL Ledger', title],
    [],
    ['Line', ...partners.map((p) => p.name)],
    ...lineKeys.map((key, i) => [
      partners[0].lines[i].label,
      ...partners.map((p) => money(p.lines.find((l) => l.key === key)?.amount ?? 0)),
    ]),
    ['Take-home', ...partners.map((p) => money(p.takeHome))],
    [],
    ['Profit view (sales completed this month)'],
    ['Sales profit', money(profit.salesProfit)],
    ['Expenses', money(-profit.expenses)],
    ['Company profit (before tax)', money(profit.companyProfit)],
    ...partners.map((p, i): Cell[] => [
      `${p.name} profit`,
      money(i === 0 ? profit.partnerProfit.tanvir : profit.partnerProfit.md),
    ]),
  ]

  const details = partners.map(
    (p): SheetData => ({
      name: `${p.name} detail`.slice(0, 31),
      widths: [28, 14, 28, 40, 14],
      rows: [
        [`${p.name} — ${title}`],
        [],
        ['Line', 'Date', 'Item', 'Details', 'Amount'],
        ...p.lines.flatMap((line): Cell[][] => [
          ...line.rows.map((r): Cell[] => [line.label, r.date ? formatDate(r.date) : '', r.title, r.detail, money(r.amount)]),
          [`${line.label} total`, null, null, null, money(line.amount)],
        ]),
        [],
        ['Take-home', null, null, null, money(p.takeHome)],
      ],
    }),
  )

  return [{ name: 'Summary', rows: summary, widths: [40, ...partners.map(() => 16)] }, ...details]
}

/** Builds and downloads the .xlsx. SheetJS is loaded only when this runs. */
export async function downloadStatement(month: Month, partners: PartnerExport[], profit: ProfitView) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  for (const sheet of statementSheets(month, partners, profit)) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows)
    for (const cell of Object.values(ws)) {
      if (cell && typeof cell === 'object' && 't' in cell && cell.t === 'n') cell.z = '#,##0.00;[Red]-#,##0.00'
    }
    ws['!cols'] = sheet.widths.map((wch) => ({ wch }))
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  }
  XLSX.writeFile(wb, `RPL statement ${month}.xlsx`)
}
