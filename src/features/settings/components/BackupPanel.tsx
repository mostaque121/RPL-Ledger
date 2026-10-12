import { useState } from 'react'
import { DatabaseBackupIcon, DownloadIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import { useDownloadBackupMutation } from '../api/backup'
import { BACKUP_TABLES } from '../backup'
import { SettingsHeader, SettingsRow } from './settings-ui'

/** When this browser last downloaded a backup, as a reminder only. */
const LAST_KEY = 'rpl:last-backup-at'

function readLast(): string | null {
  try {
    return localStorage.getItem(LAST_KEY)
  } catch {
    return null
  }
}

export function BackupPanel() {
  const download = useDownloadBackupMutation()
  const [last, setLast] = useState(readLast)

  function run() {
    download.mutate(undefined, {
      onSuccess: () => {
        const now = new Date().toISOString()
        setLast(now)
        try {
          localStorage.setItem(LAST_KEY, now)
        } catch {
          // Storage blocked: the reminder just won't show.
        }
      },
    })
  }

  return (
    <div className="space-y-2">
      <SettingsHeader
        icon={DatabaseBackupIcon}
        title="Backup"
        description="Keep your own copy of every sale, payment, expense and invoice, in case the database is ever lost."
      />

      <SettingsRow
        title="Download a backup"
        description="One Excel file with every table as it's stored. Keep it somewhere safe (it has client details). Once a month is a good habit."
      >
        <div className="space-y-3">
          <Button onClick={run} disabled={download.isPending}>
            {download.isPending ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
            {download.isPending ? 'Preparing…' : 'Download backup (.xlsx)'}
          </Button>
          <p className="text-sm text-muted-foreground">
            {last ? `Last downloaded on this computer: ${formatDateTime(last)}.` : 'Not downloaded on this computer yet.'}
          </p>
          <p className="text-xs text-muted-foreground">
            {BACKUP_TABLES.length} tables: {BACKUP_TABLES.join(', ')}. Invoice PDFs aren't in the file, but every
            invoice version is, so they can be made again.
          </p>
        </div>
      </SettingsRow>

      <SettingsRow title="Full database copy" description="For moving to a new Supabase project, or a restore.">
        <p className="text-sm leading-relaxed text-muted-foreground">
          The step-by-step guide is in <code className="font-mono text-foreground">docs/BACKUP.md</code>: what Supabase
          keeps for you, and how to take and restore a complete copy with <code className="font-mono">pg_dump</code>.
        </p>
      </SettingsRow>
    </div>
  )
}
