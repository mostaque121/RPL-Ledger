/**
 * Employee pay history: which salary / per-sale commission applies on a date. Pure, so it's tested.
 * Mirrors the SQL function `employee_rate_on` (migration 0009), which the salaries RPC uses.
 */
import { monthOf, type IsoDate, type Month } from '@/lib/accounting'

export interface PayRate {
  id: string
  /** The day this rate starts. */
  effectiveFrom: IsoDate
  /** Whole taka per month; null = no salary. */
  salaryBdt: number | null
  /** Whole taka per completed sale; null = no commission. */
  commissionPerSaleBdt: number | null
}

/**
 * The rate in force on `on`: the latest one starting on or before it. A date before every rate
 * gets the earliest one (the first rate also covers older sales). Null when there are none.
 */
export function rateOn<R extends Pick<PayRate, 'effectiveFrom'>>(rates: readonly R[], on: IsoDate): R | null {
  let started: R | null = null
  let earliest: R | null = null
  for (const r of rates) {
    if (!earliest || r.effectiveFrom < earliest.effectiveFrom) earliest = r
    if (r.effectiveFrom <= on && (!started || r.effectiveFrom > started.effectiveFrom)) started = r
  }
  return started ?? earliest
}

const lastDayOf = (month: Month): IsoDate => {
  const [y, m] = month.split('-').map(Number)
  const day = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${month}-${String(day).padStart(2, '0')}`
}

/**
 * The rate to show for a month: as it stood at the end of a past month, today for the current
 * month, and on the 1st for a future month.
 */
export function rateForMonth<R extends Pick<PayRate, 'effectiveFrom'>>(rates: readonly R[], month: Month, today: IsoDate): R | null {
  const current = monthOf(today)
  const on = month === current ? today : month < current ? lastDayOf(month) : `${month}-01`
  return rateOn(rates, on)
}

/** Oldest first. */
export const sortRates = <R extends Pick<PayRate, 'effectiveFrom'>>(rates: readonly R[]): R[] =>
  [...rates].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
