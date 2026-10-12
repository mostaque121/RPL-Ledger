/**
 * Integer-cent helpers. Inside the app every money value is an integer number of cents.
 * Convert with `toCents` when reading from the DB and `fromCents` when writing back.
 */

export type Cents = number

/** Dollars (number or numeric string from Postgres) → integer cents. */
export function toCents(amount: number | string | null | undefined): Cents {
  if (amount === null || amount === undefined || amount === '') return 0
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(n)) throw new Error(`Invalid money amount: ${String(amount)}`)
  return roundHalfAwayFromZero(n * 100)
}

/** Integer cents → dollars with 2 decimals (for writing to the DB). */
export function fromCents(cents: Cents): number {
  return cents / 100
}

/** `Math.round` rounds -0.5 toward +∞; money must round symmetrically. */
export function roundHalfAwayFromZero(x: number): number {
  // The epsilon absorbs float noise such as 1.005 * 100 = 100.49999999999999.
  return Math.sign(x) * Math.round(Math.abs(x) + 1e-9)
}

/** `pct` percent of an amount, rounded to the cent. */
export function percentOf(cents: Cents, pct: number): Cents {
  return roundHalfAwayFromZero((cents * pct) / 100)
}

/**
 * Split an amount by a percentage. The second part is the remainder,
 * so `first + second === total` always.
 */
export function splitByPercent(total: Cents, firstPct: number): [Cents, Cents] {
  const first = percentOf(total, firstPct)
  return [first, total - first]
}

export function sumCents<T>(items: readonly T[], pick: (item: T) => Cents): Cents {
  let total = 0
  for (const item of items) total += pick(item)
  return total
}

/**
 * Parse what someone typed into a money field into integer minor units (cents / poisha).
 * Accepts `1,234.5`, `$1234`, ` 22 000 `. Returns null for empty or invalid text,
 * or when it has more than 2 decimals.
 */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[\s,$৳]/g, '').replace(/^A(?=\d|-)/i, '')
  if (!/^-?(\d+\.?\d{0,2}|\.\d{1,2})$/.test(cleaned)) return null
  return toCents(Number(cleaned))
}

/** Integer minor units → editable text, e.g. `123450` → `1234.50`. */
export function amountToText(minor: number | null): string {
  return minor === null ? '' : (minor / 100).toFixed(2)
}
