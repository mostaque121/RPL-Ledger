/**
 * Single-key shortcuts: `N` runs at once, `G` then `S` is a two-key sequence.
 * Keys are stored upper-case (letters) or as typed (`?`, `,`).
 */
export type Shortcut = readonly string[]

/** How long after the first key of a sequence the second one still counts. */
export const SEQUENCE_MS = 1500

export const normalizeKey = (key: string) => (key.length === 1 ? key.toUpperCase() : key)

export type ShortcutMatch<T> = { kind: 'run'; item: T } | { kind: 'wait'; prefix: string } | { kind: 'none' }

/** What a key press does, given the first key of a sequence if one is waiting. */
export function matchShortcut<T extends { shortcut?: Shortcut }>(items: readonly T[], key: string, prefix: string | null): ShortcutMatch<T> {
  const k = normalizeKey(key)
  const keys = prefix ? [prefix, k] : [k]
  const item = items.find((i) => i.shortcut?.length === keys.length && i.shortcut.every((s, n) => s === keys[n]))
  if (item) return { kind: 'run', item }
  if (!prefix && items.some((i) => i.shortcut?.length === 2 && i.shortcut[0] === k)) return { kind: 'wait', prefix: k }
  return { kind: 'none' }
}
