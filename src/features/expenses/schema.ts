import { z } from 'zod'
import type { ExpenseSplit } from '@/lib/accounting'
import type { ExpenseCategory } from '@/types/db'

export const EXPENSE_CATEGORIES = [
  'Ads',
  'Software',
  'Phone',
  'Salary',
  'Employee commission',
  'Lead cost',
  'Other',
] as const satisfies readonly ExpenseCategory[]

/** Categories paid to an employee (in BDT), so the form asks who. */
export const EMPLOYEE_CATEGORIES: readonly ExpenseCategory[] = ['Salary', 'Employee commission']

export const EXPENSE_SPLITS = ['shared', 'tanvir', 'md'] as const satisfies readonly ExpenseSplit[]

const MAX_MINOR = 10_000_000_00

export const expenseSchema = z
  .object({
    spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick the date'),
    category: z.enum(EXPENSE_CATEGORIES, { error: 'Pick a category' }),
    description: z.string().trim().max(200, 'Keep it under 200 characters'),
    currency: z.enum(['AUD', 'BDT']),
    /** Minor units (cents or poisha), from MoneyInput. */
    amount: z.number({ error: 'Enter the amount' }).int().positive('Must be more than 0').max(MAX_MINOR, 'That looks too big'),
    /** Taka per A$1. An empty number field gives NaN. */
    fxRate: z.union([z.number(), z.nan()]).nullable(),
    employeeId: z.string(),
    split: z.enum(EXPENSE_SPLITS),
  })
  .superRefine((v, ctx) => {
    if (v.currency !== 'BDT') return
    const rate = v.fxRate ?? Number.NaN
    if (!Number.isFinite(rate) || rate <= 0) {
      ctx.addIssue({ code: 'custom', path: ['fxRate'], message: 'Enter the rate (taka per A$1)' })
    } else if (rate > 1000) {
      ctx.addIssue({ code: 'custom', path: ['fxRate'], message: 'That rate looks wrong' })
    } else if (Math.abs(rate * 10_000 - Math.round(rate * 10_000)) > 1e-6) {
      ctx.addIssue({ code: 'custom', path: ['fxRate'], message: 'Use at most 4 decimals' })
    }
  })

export type ExpenseValues = z.infer<typeof expenseSchema>
