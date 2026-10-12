import { useCallback, useState } from 'react'
import { defaultItems, normalizeItems, type ViewItem, type ViewItemDef } from '@/lib/view-prefs'

const PREFIX = 'rpl-ledger:view:'

function read<Id extends string>(key: string, defs: readonly ViewItemDef<Id>[]): ViewItem<Id>[] {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return normalizeItems(raw ? JSON.parse(raw) : null, defs)
  } catch {
    // Blocked storage or broken JSON: the defaults are fine.
    return defaultItems(defs)
  }
}

function write(key: string, items: readonly ViewItem[]) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(items))
  } catch {
    // Blocked storage: the choice just won't be remembered.
  }
}

/**
 * A list of columns or filters the viewer can show, hide and reorder, remembered in this
 * browser (localStorage). `defs` must be stable (module-level).
 */
export function useViewItems<Id extends string>(key: string, defs: readonly ViewItemDef<Id>[]) {
  const [items, setState] = useState(() => read(key, defs))

  const setItems = useCallback(
    (next: ViewItem<Id>[]) => {
      setState(next)
      write(key, next)
    },
    [key],
  )

  const reset = useCallback(() => {
    setState(defaultItems(defs))
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      // ignore
    }
  }, [key, defs])

  return [items, setItems, reset] as const
}
