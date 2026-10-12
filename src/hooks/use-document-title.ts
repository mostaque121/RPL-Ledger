import { useEffect } from 'react'

export const APP_NAME = 'RPL Ledger'

/** Sets the browser tab title to `<page> · RPL Ledger` (just the app name when there's no page). */
export function useDocumentTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} · ${APP_NAME}` : APP_NAME
  }, [page])
}
