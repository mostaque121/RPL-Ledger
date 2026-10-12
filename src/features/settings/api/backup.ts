import { useAppMutation } from '@/hooks/use-app-mutation'
import { unwrap } from '@/lib/errors'
import { formatDateTime, todayInSydney } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { BACKUP_TABLES, contentsRows, tableRows, type BackupData, type BackupRow, type BackupTable } from '../backup'

/** PostgREST returns at most 1000 rows per request, so bigger tables come in pages. */
const PAGE = 1000

async function fetchTable(table: BackupTable): Promise<BackupRow[]> {
  const rows: BackupRow[] = []
  for (let from = 0; ; from += PAGE) {
    // Ordering by `created_at` and the primary key keeps the pages stable.
    const page = unwrap(
      await supabase
        .from(table as 'sales')
        .select('*')
        .order('created_at')
        .order(table === 'settings' ? 'key' : 'id')
        .range(from, from + PAGE - 1),
    ) as BackupRow[]
    rows.push(...page)
    if (page.length < PAGE) return rows
  }
}

/** Reads every table and downloads `RPL Ledger backup <date>.xlsx`. Returns the number of rows saved. */
async function downloadBackup(): Promise<number> {
  const [XLSX, tables] = await Promise.all([import('xlsx'), Promise.all(BACKUP_TABLES.map(fetchTable))])
  const data = Object.fromEntries(BACKUP_TABLES.map((t, i) => [t, tables[i]])) as BackupData

  const wb = XLSX.utils.book_new()
  const contents = XLSX.utils.aoa_to_sheet(contentsRows(data, formatDateTime(new Date().toISOString())))
  contents['!cols'] = [{ wch: 22 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, contents, 'Contents')
  for (const table of BACKUP_TABLES) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tableRows(data[table])), table)
  }
  XLSX.writeFile(wb, `RPL Ledger backup ${todayInSydney()}.xlsx`)
  return tables.reduce((sum, rows) => sum + rows.length, 0)
}

export function useDownloadBackupMutation() {
  return useAppMutation({
    mutationFn: downloadBackup,
    success: (rows) => `Backup downloaded (${rows.toLocaleString('en-AU')} rows)`,
  })
}
