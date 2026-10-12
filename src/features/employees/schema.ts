import { z } from 'zod'
import { isoDate } from '@/features/sales/schema'

/** BDT amounts in the form are integer poisha (MoneyInput reports minor units); `null` = not set. */
const optionalBdt = z
  .number()
  .int()
  .nonnegative("Can't be negative")
  .max(100_000_000_00, 'That looks too big')
  .nullable()

export const personSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(60, 'Keep it under 60 characters'),
  salaryBdt: optionalBdt,
  commissionPerSaleBdt: optionalBdt,
  /** The day new or changed pay starts. */
  effectiveFrom: isoDate('Pick the date the pay starts'),
})

export type PersonValues = z.infer<typeof personSchema>
