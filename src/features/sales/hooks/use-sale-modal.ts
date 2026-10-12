import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import type { BackState } from '@/components/layout/TopBar'
import { saleHref } from '../links'

export type SaleModalRequest = { kind: 'new' } | { kind: 'edit'; saleId: string }

/**
 * The sale form is a full-page modal mounted once in the app layout, so it opens on any page:
 * `?saleForm=new` to add a sale, `?saleForm=<sale id>` to edit one. Back closes it.
 */
const FORM = 'saleForm'

const withoutModal = (prev: URLSearchParams) => {
  const next = new URLSearchParams(prev)
  next.delete(FORM)
  return next
}

/** Set on the history entry that opened the modal, so closing can simply go back. */
const OPENED_HERE = { saleModal: true }

export function useSaleModal() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const form = params.get(FORM)
  const request: SaleModalRequest | null = form === 'new' ? { kind: 'new' } : form ? { kind: 'edit', saleId: form } : null

  const open = useCallback(
    (value: string) =>
      setParams(
        (prev) => {
          const next = withoutModal(prev)
          next.set(FORM, value)
          return next
        },
        { state: OPENED_HERE },
      ),
    [setParams],
  )
  const openNew = useCallback(() => open('new'), [open])
  const openEdit = useCallback((saleId: string) => open(saleId), [open])

  const openedHere = (location.state as typeof OPENED_HERE | null)?.saleModal === true

  /** Back to the page underneath, as it was. */
  const close = useCallback(() => {
    if (openedHere) void navigate(-1)
    else setParams(withoutModal, { replace: true })
  }, [openedHere, navigate, setParams])

  /**
   * After saving. A new sale opens on its own page (replacing the modal's history entry, with Back
   * returning to where it was added from); an edit just closes the modal.
   */
  const finish = useCallback(
    (saleId: string, created: boolean) => {
      if (!created) return close()
      const rest = withoutModal(params).toString()
      const from = `${location.pathname}${rest ? `?${rest}` : ''}`
      void navigate(saleHref(saleId), { replace: true, state: { from } satisfies BackState })
    },
    [close, params, location.pathname, navigate],
  )

  return { request, openNew, openEdit, close, finish }
}
