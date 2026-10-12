/**
 * Per-viewer list preferences (which columns / filters show, and in what order), kept in
 * localStorage. Pure helpers here; `useViewPrefs` does the storage.
 */

export interface ViewItemDef<Id extends string = string> {
  id: Id
  label: string
  /** Always shown; can still be moved. */
  required?: boolean
  /** Shown until the viewer changes it. */
  defaultVisible: boolean
}

export interface ViewItem<Id extends string = string> {
  id: Id
  visible: boolean
}

export const defaultItems = <Id extends string>(defs: readonly ViewItemDef<Id>[]): ViewItem<Id>[] =>
  defs.map((d) => ({ id: d.id, visible: d.required || d.defaultVisible }))

/**
 * Makes stored items safe to use: keeps the stored order and choices for known ids, drops unknown
 * or repeated ids, forces required items on, and slots items added since (new columns) in after
 * the item that comes before them in `defs`.
 */
export function normalizeItems<Id extends string>(stored: unknown, defs: readonly ViewItemDef<Id>[]): ViewItem<Id>[] {
  if (!Array.isArray(stored)) return defaultItems(defs)
  const byId = new Map(defs.map((d) => [d.id as string, d]))
  const items: ViewItem<Id>[] = []
  const seen = new Set<string>()
  for (const raw of stored as unknown[]) {
    if (typeof raw !== 'object' || raw === null) continue
    const { id, visible } = raw as { id?: unknown; visible?: unknown }
    if (typeof id !== 'string' || seen.has(id)) continue
    const def = byId.get(id)
    if (!def) continue
    seen.add(id)
    items.push({ id: def.id, visible: def.required ? true : visible === true })
  }
  defs.forEach((def, i) => {
    if (seen.has(def.id)) return
    const before = defs.slice(0, i).map((d) => d.id as string)
    const at = items.reduce((pos, item, j) => (before.includes(item.id) ? j + 1 : pos), 0)
    items.splice(at, 0, { id: def.id, visible: def.required || def.defaultVisible })
    seen.add(def.id)
  })
  return items
}

/** Moves the item `from` to where `to` is (drag and drop). */
export function moveItem<T extends { id: string }>(items: readonly T[], from: string, to: string): T[] {
  const a = items.findIndex((i) => i.id === from)
  const b = items.findIndex((i) => i.id === to)
  if (a < 0 || b < 0 || a === b) return [...items]
  const next = [...items]
  const [moved] = next.splice(a, 1)
  next.splice(b, 0, moved)
  return next
}

/** Shows or hides one item. Required items stay on. */
export function toggleItem<Id extends string>(
  items: readonly ViewItem<Id>[],
  defs: readonly ViewItemDef<Id>[],
  id: Id,
  visible: boolean,
): ViewItem<Id>[] {
  const required = defs.find((d) => d.id === id)?.required
  return items.map((i) => (i.id === id ? { ...i, visible: required ? true : visible } : i))
}

export const visibleIds = <Id extends string>(items: readonly ViewItem<Id>[]): Id[] =>
  items.filter((i) => i.visible).map((i) => i.id)
