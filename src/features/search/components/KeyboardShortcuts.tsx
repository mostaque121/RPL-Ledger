import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useCommands } from '../hooks/use-commands'
import { ShortcutsHelpContext } from '../hooks/shortcuts-help'
import { useShortcutKeys } from '../hooks/use-shortcut-keys'
import { ShortcutsDialog } from './ShortcutsDialog'

/** App-wide single-key shortcuts (N = new sale, G then S = Sales, ? = the list). Wraps the signed-in app. */
export function KeyboardShortcuts({ children }: { children: ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false)
  const openHelp = useCallback(() => setHelpOpen(true), [])

  return (
    <ShortcutsHelpContext.Provider value={openHelp}>
      {children}
      <ShortcutListener helpOpen={helpOpen} onHelpOpenChange={setHelpOpen} />
    </ShortcutsHelpContext.Provider>
  )
}

/** Inside the provider, so the "Keyboard shortcuts" command can open the list. */
function ShortcutListener({ helpOpen, onHelpOpenChange }: { helpOpen: boolean; onHelpOpenChange: (open: boolean) => void }) {
  const { actions, pages } = useCommands()
  const all = useMemo(() => [...actions, ...pages], [actions, pages])
  useShortcutKeys(all)
  return <ShortcutsDialog open={helpOpen} onOpenChange={onHelpOpenChange} actions={actions} pages={pages} />
}
