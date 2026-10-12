import { useAppMutation } from '@/hooks/use-app-mutation'
import type { IsoDate } from '@/lib/accounting'
import { unwrap } from '@/lib/errors'
import { fromCents, type Cents } from '@/lib/money'
import { supabase } from '@/lib/supabase'
import { salesKeys } from './sales'

/** Client payments (`payments`) and payments to the RTO (`rto_payments`) share one shape. */
export type PaymentKind = 'client' | 'rto'

export interface PaymentInput {
  kind: PaymentKind
  saleId: string
  /** Set to edit an existing payment. */
  id?: string
  paidOn: IsoDate
  /** Negative = refund. */
  amount: Cents
  note: string | null
  /** RTO payments only, e.g. OS / OC / NC. */
  agency?: string | null
}

const LABEL: Record<PaymentKind, string> = { client: 'Payment', rto: 'RTO payment' }

async function savePayment({ kind, saleId, id, paidOn, amount, note, agency }: PaymentInput) {
  const row = { sale_id: saleId, paid_on: paidOn, amount: fromCents(amount), note }
  const query =
    kind === 'client'
      ? id
        ? supabase.from('payments').update(row).eq('id', id)
        : supabase.from('payments').insert(row)
      : id
        ? supabase.from('rto_payments').update({ ...row, agency: agency ?? null }).eq('id', id)
        : supabase.from('rto_payments').insert({ ...row, agency: agency ?? null })
  unwrap(await query)
}

export function useSavePaymentMutation() {
  return useAppMutation({
    mutationFn: savePayment,
    invalidate: [salesKeys.all],
    success: (_, v) => `${LABEL[v.kind]} ${v.id ? 'saved' : 'added'}`,
  })
}

async function deletePayment({ kind, id }: { kind: PaymentKind; id: string }) {
  unwrap(await supabase.from(kind === 'client' ? 'payments' : 'rto_payments').delete().eq('id', id))
}

export function useDeletePaymentMutation() {
  return useAppMutation({
    mutationFn: deletePayment,
    invalidate: [salesKeys.all],
    success: (_, v) => `${LABEL[v.kind]} removed`,
  })
}
