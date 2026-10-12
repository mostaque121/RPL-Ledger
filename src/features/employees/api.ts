import { useQuery } from '@tanstack/react-query'
import { useAppMutation } from '@/hooks/use-app-mutation'
import type { IsoDate, PartnerKey } from '@/lib/accounting'
import { unwrap } from '@/lib/errors'
import { formatDate, todayInSydney } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { PersonRole } from '@/types/db'
import { rateOn, sortRates, type PayRate } from './rates'

export interface Person {
  id: string
  name: string
  role: PersonRole
  partnerKey: PartnerKey | null
  /** Pay history, oldest first. Empty for partners. Use `rateOn` for the rate on a date. */
  rates: PayRate[]
  /** Today's rate, for display and defaults. Whole taka (BDT is display currency, not kept in cents). */
  salaryBdt: number | null
  commissionPerSaleBdt: number | null
  active: boolean
  /** Sales + linked expenses. A person with any history can only be deactivated. */
  historyCount: number
}

export const peopleKeys = { all: ['people'] as const }

const DUPLICATE = { '23505': 'Someone with that name already exists.' }
const nullableNumber = (v: number | null) => (v === null ? null : Number(v))

async function fetchPeople(): Promise<Person[]> {
  const rows = unwrap(
    await supabase
      .from('people')
      .select(
        'id, name, role, partner_key, active, sales(count), expenses(count), rates:employee_rates(id, effective_from, salary_bdt, commission_per_sale_bdt)',
      )
      .order('role', { ascending: false }) // partners first
      .order('name'),
  )
  const today = todayInSydney()
  return rows.map((r) => {
    const rates = sortRates(
      r.rates.map((x) => ({
        id: x.id,
        effectiveFrom: x.effective_from,
        salaryBdt: nullableNumber(x.salary_bdt),
        commissionPerSaleBdt: nullableNumber(x.commission_per_sale_bdt),
      })),
    )
    const current = rateOn(rates, today)
    return {
      id: r.id,
      name: r.name,
      role: r.role,
      partnerKey: r.partner_key,
      rates,
      salaryBdt: current?.salaryBdt ?? null,
      commissionPerSaleBdt: current?.commissionPerSaleBdt ?? null,
      active: r.active,
      historyCount: (r.sales[0]?.count ?? 0) + (r.expenses[0]?.count ?? 0),
    }
  })
}

/** Partners first, then employees A→Z. Filter on `active` for pickers. */
export function usePeopleQuery() {
  return useQuery({ queryKey: peopleKeys.all, queryFn: fetchPeople })
}

export interface PayInput {
  salaryBdt: number | null
  commissionPerSaleBdt: number | null
  /** The day this pay starts. */
  effectiveFrom: IsoDate
}

export interface EmployeeInput extends PayInput {
  name: string
}

/** Only employees are created here; the two partners come from the seed. */
async function createEmployee(input: EmployeeInput) {
  const inserted = await supabase.from('people').insert({ name: input.name.trim(), role: 'employee' }).select('id').single()
  const person = unwrap(inserted, DUPLICATE)
  if (input.salaryBdt === null && input.commissionPerSaleBdt === null) return
  const { error } = await supabase.from('employee_rates').insert(rateRow(person.id, input))
  if (error) throw new Error(`${input.name.trim()} was added, but the pay wasn't saved. Set it with "Edit".`)
}

export function useCreateEmployeeMutation() {
  return useAppMutation({
    mutationFn: createEmployee,
    invalidate: [peopleKeys.all],
    success: (_, v) => `${v.name.trim()} added`,
  })
}

export interface PersonUpdate {
  id: string
  name?: string
  active?: boolean
}

async function updatePerson({ id, name, active }: PersonUpdate) {
  unwrap(await supabase.from('people').update({ name: name?.trim(), active }).eq('id', id), DUPLICATE)
}

export function useUpdatePersonMutation() {
  return useAppMutation({ mutationFn: updatePerson, invalidate: [peopleKeys.all], success: 'Saved' })
}

const rateRow = (personId: string, p: PayInput) => ({
  person_id: personId,
  effective_from: p.effectiveFrom,
  salary_bdt: p.salaryBdt,
  commission_per_sale_bdt: p.commissionPerSaleBdt,
})

/** Records new pay from a date. A change on a day that already has one replaces it. */
async function setPay({ personId, ...pay }: PayInput & { personId: string }) {
  unwrap(await supabase.from('employee_rates').upsert(rateRow(personId, pay), { onConflict: 'person_id,effective_from' }))
}

export function useSetPayMutation() {
  return useAppMutation({
    mutationFn: setPay,
    invalidate: [peopleKeys.all],
    success: (_, v) => `New pay from ${formatDate(v.effectiveFrom)} saved`,
  })
}

/** Removes one change from the history; the rate before it applies again. */
async function deletePay(id: string) {
  unwrap(await supabase.from('employee_rates').delete().eq('id', id))
}

export function useDeletePayMutation() {
  return useAppMutation({ mutationFn: deletePay, invalidate: [peopleKeys.all], success: 'Pay change removed' })
}

async function deletePerson(id: string) {
  unwrap(await supabase.from('people').delete().eq('id', id), {
    '23503': 'This person has sales or expenses. Deactivate them instead.',
  })
}

export function useDeletePersonMutation() {
  return useAppMutation({ mutationFn: deletePerson, invalidate: [peopleKeys.all], success: 'Removed' })
}
