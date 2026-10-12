import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

/**
 * `?add=<what>` opens a page's "add" dialog (`/expenses?add=expense`), so the command box or any
 * link can open it from anywhere, and Back closes it.
 */
const PARAM = 'add'

/** Set on the history entry that opened the dialog, so closing can simply go back. */
const OPENED_HERE = { addDialog: true }

export type AddDialog = 'expense' | 'salaries' | 'task' | 'employee'

/** Link that opens an add dialog on its page. */
export const addDialogHref = (path: string, what: AddDialog) => `${path}?${PARAM}=${what}`

export function useAddDialog(what: AddDialog): [boolean, (open: boolean) => void] {
  const [params, setParams] = useSearchParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const openedHere = (state as typeof OPENED_HERE | null)?.addDialog === true

  const setOpen = useCallback(
    (open: boolean) => {
      if (open) {
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.set(PARAM, what)
            return next
          },
          { state: OPENED_HERE },
        )
      } else if (openedHere) {
        void navigate(-1)
      } else {
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete(PARAM)
            return next
          },
          { replace: true },
        )
      }
    },
    [setParams, what, openedHere, navigate],
  )

  return [params.get(PARAM) === what, setOpen]
}
