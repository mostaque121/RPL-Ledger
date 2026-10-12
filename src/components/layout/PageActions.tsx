import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { usePageActionsTarget } from './page-actions-context'

/**
 * Puts a page's buttons (e.g. "Add sale") in the top bar, next to the page title.
 * Usage inside any page: `<PageActions><Button>Add sale</Button></PageActions>`
 */
export function PageActions({ children }: { children: ReactNode }) {
  const target = usePageActionsTarget()
  return target ? createPortal(children, target) : null
}
