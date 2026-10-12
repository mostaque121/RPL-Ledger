import { useQuery } from '@tanstack/react-query'
import { useAppMutation } from '@/hooks/use-app-mutation'
import type { Month } from '@/lib/accounting'
import { unwrap } from '@/lib/errors'
import { formatMonth } from '@/lib/format'
import { firstDayOf, monthOfDate } from '@/lib/month'
import { supabase } from '@/lib/supabase'

export interface FxRate {
  id: string
  month: Month
  /** Taka per 1 AUD, e.g. 88.4 */
  audToBdt: number
}

export const fxRateKeys = { all: ['fx-rates'] as const }

/** Newest month first. */
async function fetchFxRates(): Promise<FxRate[]> {
  const rows = unwrap(
    await supabase.from('fx_rates').select('id, month, aud_to_bdt').order('month', { ascending: false }),
  )
  return rows.map((r) => ({ id: r.id, month: monthOfDate(r.month), audToBdt: Number(r.aud_to_bdt) }))
}

export function useFxRatesQuery() {
  return useQuery({ queryKey: fxRateKeys.all, queryFn: fetchFxRates })
}

/** The rate for a month, or null if none is set. */
export function rateFor(rates: readonly FxRate[], month: Month): number | null {
  return rates.find((r) => r.month === month)?.audToBdt ?? null
}

export interface FxRateInput {
  month: Month
  audToBdt: number
}

/** Insert or overwrite the rate for a month (one row per month). */
async function upsertFxRate({ month, audToBdt }: FxRateInput) {
  unwrap(
    await supabase.from('fx_rates').upsert({ month: firstDayOf(month), aud_to_bdt: audToBdt }, { onConflict: 'month' }),
  )
}

export function useUpsertFxRateMutation() {
  return useAppMutation({
    mutationFn: upsertFxRate,
    invalidate: [fxRateKeys.all],
    success: (_, v) => `Rate for ${formatMonth(v.month)} saved`,
  })
}

/** Deleting a rate is always safe: each BDT expense keeps the rate it was saved with. */
async function deleteFxRate(id: string) {
  unwrap(await supabase.from('fx_rates').delete().eq('id', id))
}

export function useDeleteFxRateMutation() {
  return useAppMutation({ mutationFn: deleteFxRate, invalidate: [fxRateKeys.all], success: 'Rate removed' })
}
