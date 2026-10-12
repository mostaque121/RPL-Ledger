import { useQuery } from '@tanstack/react-query'
import { useAppMutation } from '@/hooks/use-app-mutation'
import { unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { InvoiceIssuerJson, InvoiceProfileRow } from '@/types/db'
import type { InvoiceProfileValues, IssuerValues } from '../schema'

/** Company, bank and numbering defaults for new invoices (one row, edited on Settings). */
export type InvoiceProfile = InvoiceProfileValues

export const invoiceProfileKeys = { all: ['invoice-profile'] as const }

/** Used if the row is missing. Matches the migration defaults. */
const DEFAULT_PROFILE: InvoiceProfile = {
  companyName: 'RPL Fast Track',
  address: '',
  phone: '',
  email: '',
  website: '',
  abn: '',
  bankAccountName: '',
  bankBsb: '',
  bankAccountNumber: '',
  numberPrefix: 'RFT-',
  firstNumber: 4528,
  paymentTermsDays: 7,
  gstIncluded: true,
  defaultNotes: '',
}

// ---------------------------------------------------------------- issuer <-> DB (shared with versions)

export const issuerFromJson = (j: InvoiceIssuerJson): IssuerValues => ({
  companyName: j.company_name,
  address: j.address,
  phone: j.phone,
  email: j.email,
  website: j.website,
  abn: j.abn,
  bankAccountName: j.bank_account_name,
  bankBsb: j.bank_bsb,
  bankAccountNumber: j.bank_account_number,
})

export const issuerToJson = (v: IssuerValues): InvoiceIssuerJson => ({
  company_name: v.companyName.trim(),
  address: v.address.trim(),
  phone: v.phone.trim(),
  email: v.email.trim(),
  website: v.website.trim(),
  abn: v.abn.trim(),
  bank_account_name: v.bankAccountName.trim(),
  bank_bsb: v.bankBsb.trim(),
  bank_account_number: v.bankAccountNumber.trim(),
})

/** The issuer part of the profile (what gets printed). */
export function issuerOf(p: InvoiceProfile): IssuerValues {
  const { companyName, address, phone, email, website, abn, bankAccountName, bankBsb, bankAccountNumber } = p
  return { companyName, address, phone, email, website, abn, bankAccountName, bankBsb, bankAccountNumber }
}

// ---------------------------------------------------------------- query + mutation

const PROFILE_COLUMNS =
  'company_name, address, phone, email, website, abn, bank_account_name, bank_bsb, bank_account_number, number_prefix, first_number, payment_terms_days, gst_included, default_notes'

async function fetchProfile(): Promise<InvoiceProfile> {
  const result = await supabase.from('invoice_profile').select(PROFILE_COLUMNS).maybeSingle()
  const row = unwrap<typeof result.data>(result)
  if (!row) return DEFAULT_PROFILE
  return {
    ...issuerFromJson(row),
    numberPrefix: row.number_prefix,
    firstNumber: row.first_number,
    paymentTermsDays: row.payment_terms_days,
    gstIncluded: row.gst_included,
    defaultNotes: row.default_notes,
  }
}

export function useInvoiceProfileQuery() {
  return useQuery({ queryKey: invoiceProfileKeys.all, queryFn: fetchProfile, staleTime: 5 * 60_000 })
}

async function saveProfile(v: InvoiceProfileValues) {
  const row: Omit<InvoiceProfileRow, 'created_at' | 'updated_at'> = {
    id: true,
    ...issuerToJson(v),
    number_prefix: v.numberPrefix.trim(),
    first_number: v.firstNumber,
    payment_terms_days: v.paymentTermsDays,
    gst_included: v.gstIncluded,
    default_notes: v.defaultNotes.trim(),
  }
  unwrap(await supabase.from('invoice_profile').upsert(row))
}

export function useSaveInvoiceProfileMutation() {
  return useAppMutation({ mutationFn: saveProfile, invalidate: [invoiceProfileKeys.all], success: 'Invoice details saved' })
}
