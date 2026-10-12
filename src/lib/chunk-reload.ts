/**
 * After a new deploy, the old build's page chunks are gone, so opening a page that wasn't loaded yet
 * fails. Reloading picks up the new build. A short guard stops a reload loop when the server is
 * really down.
 */
const KEY = 'rpl:chunk-reload-at'
const GUARD_MS = 10_000

export function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|not a valid JavaScript MIME type|Unable to preload/i.test(error.message)
  )
}

/** Reloads the page unless it already did in the last few seconds. Returns whether it reloaded. */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0)
    if (Date.now() - last < GUARD_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    // No session storage: reload anyway, the error screen's button is the fallback.
  }
  window.location.reload()
  return true
}
