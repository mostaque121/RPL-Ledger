import { createContext, useContext } from 'react'

/**
 * The content area next to the sidebar (the "inset"). Full-page modals portal into it,
 * so they cover the page but leave the sidebar visible on desktop.
 */
export const InsetContext = createContext<HTMLElement | null>(null)

export const useInsetContainer = () => useContext(InsetContext)
