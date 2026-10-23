/** Display formatting. Business time zone is Australia/Sydney. */
import { format, parseISO } from 'date-fns'
import type { Cents } from './money'

export const BUSINESS_TIME_ZONE = 'Australia/Sydney'

const audNumber = new Intl.NumberFormat('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const bdtNumber = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }) // 1,23,400

const audWhole = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 })

/**
 * `$1,234` for round figures, `$248.87` when there are cents (e.g. a BDT expense converted to AUD),
 * so nothing is hidden by rounding. Negative as `−$1,234`. Everything is AUD, so no `A$`.
 */
export function formatAud(cents: Cents): string {
  const sign = cents < 0 ? '−' : ''
  const number = cents % 100 === 0 ? audWhole : audNumber
  return `${sign}$${number.format(Math.abs(cents) / 100)}`
}

/** Same as `formatAud` (kept so existing `short` call sites read the same). */
export const formatAudShort = formatAud

/** Client-facing documents (invoices): always with cents, `$1,234.00`. */
export function formatDollars(cents: Cents): string {
  const sign = cents < 0 ? '−' : ''
  return `${sign}$${audNumber.format(Math.abs(cents) / 100)}`
}

/** `৳1,23,400` (South Asian grouping, whole taka). */
export function formatBdt(taka: number): string {
  const sign = taka < 0 ? '−' : ''
  return `${sign}৳${bdtNumber.format(Math.abs(taka))}`
}

/** `yyyy-MM-dd` → `05 Mar 2026` */
export function formatDate(isoDate: string | null | undefined): string {
  return isoDate ? format(parseISO(isoDate), 'dd MMM yyyy') : '—'
}

/** `yyyy-MM` → `Mar 2026` */
export function formatMonth(month: string): string {
  return format(parseISO(`${month}-01`), 'MMM yyyy')
}

const dateTime = new Intl.DateTimeFormat('en-AU', {
  timeZone: BUSINESS_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** A timestamp in Sydney time: `12 Oct 2026, 3:45 pm`. */
export function formatDateTime(timestamp: string): string {
  const parts = Object.fromEntries(dateTime.formatToParts(new Date(timestamp)).map((p) => [p.type, p.value]))
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${(parts.dayPeriod ?? '').toLowerCase()}`.trim()
}

const time = new Intl.DateTimeFormat('en-AU', { timeZone: BUSINESS_TIME_ZONE, hour: 'numeric', minute: '2-digit' })

/** A timestamp's time of day in Sydney: `3:45 pm`. */
export function formatTime(timestamp: string): string {
  const parts = Object.fromEntries(time.formatToParts(new Date(timestamp)).map((p) => [p.type, p.value]))
  return `${parts.hour}:${parts.minute} ${(parts.dayPeriod ?? '').toLowerCase()}`.trim()
}

/** Today's date in Sydney as `yyyy-MM-dd`, whatever time zone the browser is in. */
export function todayInSydney(now: Date = new Date()): string {
  // en-CA formats as yyyy-MM-dd
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** The current month in Sydney as `yyyy-MM`. */
export function currentMonth(now: Date = new Date()): string {
  return todayInSydney(now).slice(0, 7)
}

const rateNumber = new Intl.NumberFormat('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

/** FX rate, 2 to 4 decimals: `88.40`, `88.4125`. */
export function formatRate(rate: number): string {
  return rateNumber.format(rate)
}

const compactNumber = new Intl.NumberFormat('en-AU', { notation: 'compact', maximumFractionDigits: 1 })

/** Short dollars for chart axes: `$950`, `$1.2K`, `−$3.4M`. */
export function formatAudCompact(cents: Cents): string {
  const sign = cents < 0 ? '−' : ''
  return `${sign}$${compactNumber.format(Math.abs(cents) / 100)}`
}
