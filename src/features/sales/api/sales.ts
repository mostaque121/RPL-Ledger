import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { peopleKeys } from '@/features/employees/api'
import { courseKeys } from '@/features/settings/api/courses'
import { rtoKeys } from '@/features/settings/api/rtos'
import { useSettingsQuery } from '@/features/settings/api/settings'
import { useAppMutation } from '@/hooks/use-app-mutation'
import { saleSummary, type IsoDate, type SaleSummary, type SellerKind, type Settings } from '@/lib/accounting'
import { unwrap } from '@/lib/errors'
import { fromCents, toCents, type Cents } from '@/lib/money'
import { supabase } from '@/lib/supabase'
import type { PartnerKeyDb, SaleSource } from '@/types/db'
import { saleTaskKeys } from './tasks'

export interface Payment {
  id: string
  paidOn: IsoDate
  /** Negative = refund. */
  amount: Cents
  note: string | null
}

export interface RtoPayment extends Payment {
  agency: string | null
}

/** The `Employee commission` expense linked to a sale. */
export interface CommissionExpense {
  id: string
  spentOn: IsoDate
  /** Whole taka when paid in BDT, otherwise null. */
  bdt: number | null
  aud: Cents
}

export interface Sale {
  id: string
  saleDate: IsoDate
  sellerId: string
  sellerName: string
  seller: SellerKind
  clientName: string
  phone: string | null
  email: string | null
  courseId: string | null
  courseName: string | null
  rtoId: string | null
  rtoName: string | null
  courseFee: Cents
  rtoCost: Cents
  referralCommission: Cents
  source: SaleSource
  docsLink: string | null
  notes: string | null
  completedOn: IsoDate | null
  cancelled: boolean
  /** Oldest first. */
  payments: Payment[]
  rtoPayments: RtoPayment[]
  commission: CommissionExpense | null
}

/** A sale with everything the accounting rules derive from it. */
export interface SaleView extends Sale {
  summary: SaleSummary
}

export const salesKeys = { all: ['sales'] as const }

const SALE_COLUMNS = `
  id, sale_date, seller_id, client_name, phone, email, course_id, rto_id, course_fee, rto_cost,
  referral_commission, source, docs_link, notes, completed_on, cancelled,
  seller:people(name, role, partner_key),
  course:courses(name),
  rto:rtos(name),
  payments(id, paid_on, amount, note),
  rto_payments(id, paid_on, amount, agency, note),
  expenses(id, spent_on, category, original_amount, currency, amount_aud)
`

const byDate = <T extends { paidOn: string }>(a: T, b: T) => a.paidOn.localeCompare(b.paidOn)
const sellerKind = (partnerKey: PartnerKeyDb | null): SellerKind => partnerKey ?? 'employee'

/** Every sale, newest first. ~50 a month, so the whole list is fetched and filtered on the client. */
async function fetchSales(): Promise<Sale[]> {
  const rows = unwrap(
    await supabase
      .from('sales')
      .select(SALE_COLUMNS)
      .order('sale_date', { ascending: false })
      .order('created_at', { ascending: false }),
  )
  return rows.map((r) => {
    const commission = r.expenses.find((e) => e.category === 'Employee commission')
    return {
      id: r.id,
      saleDate: r.sale_date,
      sellerId: r.seller_id,
      sellerName: r.seller?.name ?? '—',
      seller: sellerKind(r.seller?.partner_key ?? null),
      clientName: r.client_name,
      phone: r.phone,
      email: r.email,
      courseId: r.course_id,
      courseName: r.course?.name ?? null,
      rtoId: r.rto_id,
      rtoName: r.rto?.name ?? null,
      courseFee: toCents(r.course_fee),
      rtoCost: toCents(r.rto_cost),
      referralCommission: toCents(r.referral_commission),
      source: r.source,
      docsLink: r.docs_link,
      notes: r.notes,
      completedOn: r.completed_on,
      cancelled: r.cancelled,
      payments: r.payments
        .map((p) => ({ id: p.id, paidOn: p.paid_on, amount: toCents(p.amount), note: p.note }))
        .sort(byDate),
      rtoPayments: r.rto_payments
        .map((p) => ({ id: p.id, paidOn: p.paid_on, amount: toCents(p.amount), agency: p.agency, note: p.note }))
        .sort(byDate),
      commission: commission
        ? {
            id: commission.id,
            spentOn: commission.spent_on,
            bdt: commission.currency === 'BDT' ? Number(commission.original_amount) : null,
            aud: toCents(commission.amount_aud),
          }
        : null,
    }
  })
}

/** Sales with their summaries. Waits for the settings, since tax depends on them. */
export function useSalesQuery() {
  const settings = useSettingsQuery().data
  const select = useCallback(
    (sales: Sale[]): SaleView[] => (settings ? sales.map((s) => withSummary(s, settings)) : []),
    [settings],
  )
  return useQuery({ queryKey: salesKeys.all, queryFn: fetchSales, enabled: !!settings, select })
}

export const withSummary = (sale: Sale, settings: Settings): SaleView => ({
  ...sale,
  summary: saleSummary(sale, settings),
})

// ---------------------------------------------------------------- mutations

export interface SaleInput {
  saleDate: IsoDate
  sellerId: string
  clientName: string
  phone: string | null
  email: string | null
  courseId: string | null
  rtoId: string | null
  courseFee: Cents
  rtoCost: Cents
  referralCommission: Cents
  source: SaleSource
  docsLink: string | null
  notes: string | null
}

const toRow = (s: SaleInput) => ({
  sale_date: s.saleDate,
  seller_id: s.sellerId,
  client_name: s.clientName.trim(),
  phone: s.phone,
  email: s.email,
  course_id: s.courseId,
  rto_id: s.rtoId,
  course_fee: fromCents(s.courseFee),
  rto_cost: fromCents(s.rtoCost),
  referral_commission: fromCents(s.referralCommission),
  source: s.source,
  docs_link: s.docsLink,
  notes: s.notes,
})

/**
 * Usage counts on people / RTOs / courses change when sales are added or removed.
 * Tasks carry the client's name and go with a deleted sale.
 */
const SALE_LIST_KEYS = [salesKeys.all, peopleKeys.all, rtoKeys.all, courseKeys.all, saleTaskKeys.all]

export interface CreateSaleInput extends SaleInput {
  /** A payment taken when the sale was made. */
  firstPayment: { paidOn: IsoDate; amount: Cents } | null
}

async function createSale({ firstPayment, ...sale }: CreateSaleInput): Promise<string> {
  const inserted = await supabase.from('sales').insert(toRow(sale)).select('id').single()
  const id = unwrap(inserted).id
  if (firstPayment) {
    const { error } = await supabase
      .from('payments')
      .insert({ sale_id: id, paid_on: firstPayment.paidOn, amount: fromCents(firstPayment.amount) })
    if (error) throw new Error("The sale was saved, but the first payment wasn't. Add it from the sale.")
  }
  return id
}

export function useCreateSaleMutation() {
  return useAppMutation({
    mutationFn: createSale,
    invalidate: SALE_LIST_KEYS,
    success: (_, v) => `Sale to ${v.clientName.trim()} added`,
  })
}

async function updateSale({ id, ...sale }: SaleInput & { id: string }) {
  unwrap(await supabase.from('sales').update(toRow(sale)).eq('id', id))
}

export function useUpdateSaleMutation() {
  return useAppMutation({ mutationFn: updateSale, invalidate: SALE_LIST_KEYS, success: 'Sale saved' })
}

/** Payments, RTO payments, notes and tasks go with it. A linked commission expense stays (it was paid). */
async function deleteSale(id: string) {
  unwrap(await supabase.from('sales').delete().eq('id', id))
}

export function useDeleteSaleMutation() {
  return useAppMutation({ mutationFn: deleteSale, invalidate: SALE_LIST_KEYS, success: 'Sale deleted' })
}

/** `completedOn = null` reopens the sale. */
async function setCompleted({ id, completedOn }: { id: string; completedOn: IsoDate | null }) {
  unwrap(await supabase.from('sales').update({ completed_on: completedOn }).eq('id', id))
}

export function useSetCompletedMutation() {
  return useAppMutation({
    mutationFn: setCompleted,
    invalidate: [salesKeys.all],
    success: (_, v) => (v.completedOn ? 'Marked as completed' : 'Sale reopened'),
  })
}

/** Cancelling also clears `completed_on` (a sale can't be both). */
async function setCancelled({ id, cancelled }: { id: string; cancelled: boolean }) {
  const patch = cancelled ? { cancelled, completed_on: null } : { cancelled }
  unwrap(await supabase.from('sales').update(patch).eq('id', id))
}

export function useSetCancelledMutation() {
  return useAppMutation({
    mutationFn: setCancelled,
    invalidate: [salesKeys.all],
    success: (_, v) => (v.cancelled ? 'Sale cancelled' : 'Sale restored'),
  })
}
