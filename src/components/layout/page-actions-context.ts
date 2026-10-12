import { createContext, useContext } from 'react'

/** The top-bar element that pages render their action buttons into (via `<PageActions>`). */
export const PageActionsContext = createContext<HTMLElement | null>(null)

export const usePageActionsTarget = () => useContext(PageActionsContext)
