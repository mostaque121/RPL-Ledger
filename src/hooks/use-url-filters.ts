import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

export type Validators<T> = { [K in keyof T]?: (value: string) => boolean }

/**
 * List filters kept in the URL (`?month=2026-03&category=Ads`), so a refresh keeps them and
 * other pages can link to a filtered list. A filter equal to its default is left out of the URL.
 * `defaults` must be a stable (module-level) function; it runs on every read, so a default can
 * move with time (e.g. the current month).
 */
export function useUrlFilters<T extends Record<string, string>>(defaults: () => T, validators: Validators<T> = {}) {
  const [params, setParams] = useSearchParams()

  const base = defaults()
  const filters = Object.fromEntries(
    Object.entries(base).map(([key, fallback]) => {
      const value = params.get(key)
      const ok = value !== null && (validators[key as keyof T]?.(value) ?? true)
      return [key, ok ? value : fallback]
    }),
  ) as T

  const setFilters = useCallback(
    (patch: Partial<T>) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const fallback = defaults()
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined) continue
            if (value === fallback[key]) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      ),
    [setParams, defaults],
  )

  return { filters, setFilters }
}

export const isMonthOrAll = (v: string) => v === 'all' || /^\d{4}-\d{2}$/.test(v)
export const oneOf =
  (allowed: readonly string[]) =>
  (v: string): boolean =>
    allowed.includes(v)

/** One optional URL param, e.g. the open item (`?sale=<id>`). Setting it adds a history entry, so Back closes it. */
export function useUrlParam(key: string): [string | null, (value: string | null) => void] {
  const [params, setParams] = useSearchParams()
  const set = useCallback(
    (value: string | null) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      }),
    [setParams, key],
  )
  return [params.get(key), set]
}
