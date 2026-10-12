import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

export type InvoiceModalRequest = { kind: 'new'; saleId: string | null } | { kind: 'update'; invoiceId: string }

/**
 * The invoice form is a full-page modal mounted once in the app layout, so it opens on any page:
 * `?invoiceForm=new` (plus `&invoiceSale=<id>` to fill it from a sale) or `?invoiceForm=<invoice id>`
 * to update one. The names don't clash with page params like the Invoices page's `?invoice=`.
 */
const FORM = 'invoiceForm'
const SALE = 'invoiceSale'

const withoutModal = (prev: URLSearchParams) => {
  const next = new URLSearchParams(prev)
  next.delete(FORM)
  next.delete(SALE)
  return next
}

/** Set on the history entry that opened the modal, so closing can simply go back. */
const OPENED_HERE = { invoiceModal: true }

/** True while the invoice modal is open. Pages hide their own drawers then (both are overlays). */
export function useInvoiceModalOpen(): boolean {
  const [params] = useSearchParams()
  return params.has(FORM)
}

export function useInvoiceModal() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const form = params.get(FORM)
  const request: InvoiceModalRequest | null =
    form === 'new' ? { kind: 'new', saleId: params.get(SALE) } : form ? { kind: 'update', invoiceId: form } : null

  const open = useCallback(
    (value: string, saleId?: string) =>
      setParams(
        (prev) => {
          const next = withoutModal(prev)
          next.set(FORM, value)
          if (saleId) next.set(SALE, saleId)
          return next
        },
        { state: OPENED_HERE },
      ),
    [setParams],
  )
  const openNew = useCallback((saleId?: string) => open('new', saleId), [open])
  const openUpdate = useCallback((invoiceId: string) => open(invoiceId), [open])

  const openedHere = (location.state as typeof OPENED_HERE | null)?.invoiceModal === true

  /** Back to the page underneath, as it was. */
  const close = useCallback(() => {
    if (openedHere) navigate(-1)
    else setParams(withoutModal, { replace: true })
  }, [openedHere, navigate, setParams])

  /**
   * After saving: replace the modal's history entry (so Back doesn't reopen the form) and stay on
   * the page. On the Invoices page, the saved invoice opens in its drawer.
   */
  const finish = useCallback(
    (invoiceId: string) =>
      setParams(
        (prev) => {
          const next = withoutModal(prev)
          if (location.pathname === '/invoices') next.set('invoice', invoiceId)
          return next
        },
        { replace: true },
      ),
    [setParams, location.pathname],
  )

  return { request, openNew, openUpdate, close, finish }
}
