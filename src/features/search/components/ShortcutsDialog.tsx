import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { isMac } from '@/lib/keyboard'
import { cn } from '@/lib/utils'
import type { Command } from '../hooks/use-commands'
import type { Shortcut } from '../shortcuts'
import { ShortcutKeys } from './ShortcutKeys'

interface Row {
  label: string
  keys: Shortcut
}

const MOD = isMac ? '⌘' : 'Ctrl'

const GENERAL: Row[] = [
  { label: 'Search and commands', keys: [`${MOD} K`] },
  { label: 'Search (outside a field)', keys: ['/'] },
  { label: 'This list', keys: ['?'] },
  { label: 'Close a dialog or form', keys: ['Esc'] },
  { label: 'Save a note', keys: [`${MOD} Enter`] },
]

const rowsOf = (commands: Command[]): Row[] =>
  commands.flatMap((c) => (c.shortcut && c.id !== 'shortcuts' ? [{ label: c.label, keys: c.shortcut }] : []))

interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actions: Command[]
  pages: Command[]
}

/** Every keyboard shortcut, opened with "?", the command box or the user menu. */
export function ShortcutsDialog({ open, onOpenChange, actions, pages }: ShortcutsDialogProps) {
  const groups = [
    { title: 'Create', rows: rowsOf(actions), wide: false },
    { title: 'Go to', rows: rowsOf(pages), wide: false },
    { title: 'General', rows: GENERAL, wide: true },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Single keys work anywhere, except while typing in a field or with a form open.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {groups.map((group) => (
            <section key={group.title} className={cn(group.wide && 'sm:col-span-2')}>
              <h3 className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{group.title}</h3>
              <ul className={cn(group.wide && 'sm:grid sm:grid-cols-2 sm:gap-x-8')}>
                {group.rows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-4 border-b py-2 text-sm">
                    {row.label}
                    <ShortcutKeys keys={row.keys} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
