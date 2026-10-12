import { useEffect, useRef } from 'react'
import { hasOpenOverlay, isTyping } from '@/lib/keyboard'
import { matchShortcut, SEQUENCE_MS, type Shortcut } from '../shortcuts'

/** Runs `items` by their `shortcut` keys, anywhere in the app, except while typing or with a dialog / menu open. */
export function useShortcutKeys(items: readonly { shortcut?: Shortcut; run: () => void }[]) {
  // The latest list, without re-binding the listener on every render.
  const latest = useRef(items)
  useEffect(() => {
    latest.current = items
  }, [items])

  useEffect(() => {
    let pending: { prefix: string; at: number } | null = null

    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      // Shift only for symbols like "?", so Shift + N is left alone.
      if (e.shiftKey && /^[a-z]$/i.test(e.key)) return
      if (e.key.length !== 1 || isTyping(e.target) || hasOpenOverlay()) {
        pending = null
        return
      }
      const prefix = pending && Date.now() - pending.at < SEQUENCE_MS ? pending.prefix : null
      pending = null
      const match = matchShortcut(latest.current, e.key, prefix)
      if (match.kind === 'run') {
        e.preventDefault()
        match.item.run()
      } else if (match.kind === 'wait') {
        e.preventDefault()
        pending = { prefix: match.prefix, at: Date.now() }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
