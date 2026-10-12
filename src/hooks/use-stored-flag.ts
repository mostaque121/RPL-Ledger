import { useCallback, useState } from 'react'

const PREFIX = 'rpl-ledger:flag:'

/** An on/off choice remembered in this browser (e.g. "filters row open"). Falls back to `initial`. */
export function useStoredFlag(key: string, initial: boolean) {
  const [value, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw === null ? initial : raw === '1'
    } catch {
      return initial
    }
  })

  const set = useCallback(
    (next: boolean) => {
      setState(next)
      try {
        localStorage.setItem(PREFIX + key, next ? '1' : '0')
      } catch {
        // Blocked storage: just not remembered.
      }
    },
    [key],
  )

  return [value, set] as const
}
