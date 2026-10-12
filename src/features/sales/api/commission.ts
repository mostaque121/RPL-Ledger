import { peopleKeys } from '@/features/employees/api'
import { expenseKeys } from '@/features/expenses/api'
import { useAppMutation } from '@/hooks/use-app-mutation'
import type { IsoDate } from '@/lib/accounting'
import { unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { salesKeys } from './sales'

export interface CommissionInput {
  saleId: string
  employeeId: string
  clientName: string
  /** Whole taka. */
  bdt: number
  /** That month's AUD→BDT rate. */
  rate: number
  spentOn: IsoDate
}

const toRow = (input: CommissionInput) => ({
  spent_on: input.spentOn,
  category: 'Employee commission' as const,
  description: `Commission — ${input.clientName}`,
  original_amount: input.bdt,
  currency: 'BDT' as const,
  fx_rate: input.rate,
  employee_id: input.employeeId,
  sale_id: input.saleId,
  split: 'shared' as const,
})

const DUPLICATE = { '23505': 'Commission for one of these sales is already added.' }

/** `Employee commission` expenses (BDT, shared) linked to their sales. One insert, all or nothing. */
async function addCommissions(inputs: CommissionInput[]) {
  unwrap(await supabase.from('expenses').insert(inputs.map(toRow)), DUPLICATE)
}

const KEYS = [salesKeys.all, expenseKeys.all, peopleKeys.all]

export function useAddCommissionMutation() {
  return useAppMutation({
    mutationFn: (input: CommissionInput) => addCommissions([input]),
    invalidate: KEYS,
    success: 'Commission added to expenses',
  })
}

export function useAddCommissionsMutation() {
  return useAppMutation({
    mutationFn: addCommissions,
    invalidate: KEYS,
    success: (_, v) => `${v.length} commission${v.length === 1 ? '' : 's'} added to expenses`,
  })
}

async function removeCommission(expenseId: string) {
  unwrap(await supabase.from('expenses').delete().eq('id', expenseId))
}

export function useRemoveCommissionMutation() {
  return useAppMutation({ mutationFn: removeCommission, invalidate: KEYS, success: 'Commission expense removed' })
}
