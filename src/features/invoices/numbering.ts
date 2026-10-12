/**
 * The next invoice number: the prefix plus one more than the highest number already used
 * with that prefix, and never below `firstNumber`. `RFT-4528`, `RFT-4529`, …
 * Numbers with another prefix (or typed by hand, like `RFT-4528A`) are ignored.
 */
export function nextInvoiceNumber(existing: readonly string[], prefix: string, firstNumber: number): string {
  const lowerPrefix = prefix.toLowerCase()
  let highest = firstNumber - 1
  for (const number of existing) {
    if (!number.toLowerCase().startsWith(lowerPrefix)) continue
    const rest = number.slice(prefix.length)
    if (/^\d+$/.test(rest)) highest = Math.max(highest, Number(rest))
  }
  return `${prefix}${highest + 1}`
}

/** Invoice numbers are unique ignoring case (`rft-4528` = `RFT-4528`), like the DB index. */
export function isNumberTaken(number: string, existing: readonly string[]): boolean {
  const wanted = number.trim().toLowerCase()
  return existing.some((n) => n.toLowerCase() === wanted)
}

/**
 * The PDF's file name, in Storage and when downloaded: `RFT-4528_V1.pdf`.
 * Anything other than letters, digits, `-` and `_` becomes `-`, so it's safe as a path and a file name.
 */
export function invoiceFileName(number: string, version: number): string {
  const safe = number.trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'invoice'
  return `${safe}_V${version}.pdf`
}
