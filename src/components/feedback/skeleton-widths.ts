/** Varied but stable widths, so a column of placeholders doesn't look like a grid of identical bars. */
export function pickWidth(widths: readonly string[], index: number): string {
  return widths[index % widths.length]
}
