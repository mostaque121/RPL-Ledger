import { useQuery } from '@tanstack/react-query'
import { useAppMutation } from '@/hooks/use-app-mutation'
import type { Settings } from '@/lib/accounting'
import { unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { SettingKey } from '@/types/db'

export interface AppSettings extends Settings {
  mdShare: number
}

export const settingsKeys = { all: ['settings'] as const }

/** Used only if a row is missing (e.g. the seed wasn't run). Matches the migration defaults. */
const DEFAULTS: Record<SettingKey, number> = { tax_pct: 20, tanvir_share: 60, md_share: 40 }

async function fetchSettings(): Promise<AppSettings> {
  const rows = unwrap(await supabase.from('settings').select('key, value'))
  const value = (key: SettingKey) => Number(rows.find((r) => r.key === key)?.value ?? DEFAULTS[key])
  return { taxPct: value('tax_pct'), tanvirShare: value('tanvir_share'), mdShare: value('md_share') }
}

export function useSettingsQuery() {
  return useQuery({ queryKey: settingsKeys.all, queryFn: fetchSettings, staleTime: 5 * 60_000 })
}

export interface SettingsInput {
  taxPct: number
  tanvirShare: number
}

/** One upsert = one statement, so the DB's "shares total 100" check sees both shares at once. */
async function saveSettings({ taxPct, tanvirShare }: SettingsInput) {
  unwrap(
    await supabase.from('settings').upsert([
      { key: 'tax_pct', value: taxPct },
      { key: 'tanvir_share', value: tanvirShare },
      { key: 'md_share', value: 100 - tanvirShare },
    ]),
  )
}

export function useSaveSettingsMutation() {
  return useAppMutation({ mutationFn: saveSettings, invalidate: [settingsKeys.all], success: 'Settings saved' })
}
