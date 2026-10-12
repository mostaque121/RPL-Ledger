/** `yyyy-MM` month helpers. Months compare correctly as plain strings. */
import type { Month } from './accounting'

export function addMonths(month: Month, n: number): Month {
  const [y, m] = month.split('-').map(Number)
  const index = y * 12 + (m - 1) + n
  const year = Math.floor(index / 12)
  return `${year}-${String((index % 12) + 1).padStart(2, '0')}`
}

export const nextMonth = (month: Month): Month => addMonths(month, 1)

/** `2026-03` → `2026-03-01` (how months are stored in the DB). */
export const firstDayOf = (month: Month): string => `${month}-01`

/** `2026-03-01` (or any date) → `2026-03`. */
export const monthOfDate = (date: string): Month => date.slice(0, 7)
