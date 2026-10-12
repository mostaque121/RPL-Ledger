import { createContext, useContext } from 'react'

/** Opens the keyboard-shortcuts list. Provided by `KeyboardShortcuts` in the app layout. */
export const ShortcutsHelpContext = createContext<() => void>(() => {})

export const useOpenShortcutsHelp = () => useContext(ShortcutsHelpContext)
