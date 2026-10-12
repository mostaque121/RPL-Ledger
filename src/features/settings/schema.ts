import { z } from 'zod'

/** True when `n` has at most `places` decimals (tolerates float noise). */
const hasDecimals = (n: number, places: number) => {
  const scaled = n * 10 ** places
  return Math.abs(scaled - Math.round(scaled)) < 1e-6
}

const percent = (label: string) =>
  z
    .number({ error: `Enter ${label}` })
    .min(0, `${label} can't be below 0`)
    .max(100, `${label} can't be above 100`)
    .refine((n) => hasDecimals(n, 2), 'Use at most 2 decimals')

export const settingsSchema = z.object({
  taxPct: percent('the tax %'),
  tanvirShare: percent("Tanvir's share"),
})
export type SettingsValues = z.infer<typeof settingsSchema>

export const fxRateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Pick a month'),
  audToBdt: z
    .number({ error: 'Enter the rate' })
    .gt(0, 'The rate must be above 0')
    .max(1000, 'That rate looks wrong (taka per 1 AUD)')
    .refine((n) => hasDecimals(n, 4), 'Use at most 4 decimals'),
})
export type FxRateValues = z.infer<typeof fxRateSchema>

export const nameSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(60, 'Keep it under 60 characters'),
})
export type NameValues = z.infer<typeof nameSchema>
