/**
 * Everything in the database as one Excel file: a contents sheet, then one sheet per table with
 * every row and column as stored (ids included), so nothing is lost if it ever has to be rebuilt.
 */

/** Every table, parents before children. */
export const BACKUP_TABLES = [
  'settings',
  'fx_rates',
  'people',
  'employee_rates',
  'rtos',
  'courses',
  'sales',
  'payments',
  'rto_payments',
  'expenses',
  'sale_notes',
  'sale_tasks',
  'invoice_profile',
  'invoices',
  'invoice_versions',
] as const

export type BackupTable = (typeof BACKUP_TABLES)[number]
export type BackupRow = Record<string, unknown>
export type BackupData = Record<BackupTable, BackupRow[]>

type Cell = string | number | boolean | null

/** A database value as a spreadsheet cell. JSON columns (invoice items, issuer) are kept as JSON text. */
export function toCell(value: unknown): Cell {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  return JSON.stringify(value)
}

/** A header row (every column seen, in first-seen order) then one row per record. */
export function tableRows(rows: BackupRow[]): Cell[][] {
  const columns: string[] = []
  for (const row of rows) for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key)
  return [columns, ...rows.map((row) => columns.map((c) => toCell(row[c])))]
}

/** The contents sheet: when it was made and how many rows each table has. */
export function contentsRows(data: BackupData, createdAt: string): Cell[][] {
  return [
    ['RPL Ledger backup'],
    ['Created', createdAt],
    ['Amounts are AUD dollars as stored in the database. Invoice PDFs are not included (each version is, so they can be made again).'],
    [],
    ['Table', 'Rows'],
    ...BACKUP_TABLES.map((t): Cell[] => [t, data[t].length]),
  ]
}
