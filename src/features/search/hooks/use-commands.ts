import { useMemo } from 'react'
import {
  BanknoteIcon,
  FileTextIcon,
  KeyboardIcon,
  ListTodoIcon,
  MoonIcon,
  ReceiptTextIcon,
  SettingsIcon,
  SunIcon,
  UserPlusIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useNavigate } from 'react-router'
import { NAV_ITEMS } from '@/app/navigation'
import { useInvoiceModal } from '@/features/invoices/hooks/use-invoice-modal'
import { useSaleModal } from '@/features/sales/hooks/use-sale-modal'
import { SETTINGS_NAV } from '@/features/settings/config'
import { addDialogHref } from '@/hooks/use-add-dialog'
import type { Shortcut } from '../shortcuts'
import { useOpenShortcutsHelp } from './shortcuts-help'

export interface Command {
  id: string
  label: string
  icon: LucideIcon
  /** Extra words it's found by. */
  keywords?: string[]
  /** Small text on the right, e.g. the section of a settings page. */
  hint?: string
  /** Keys that run it anywhere (see `useShortcutKeys`), shown next to it. */
  shortcut?: Shortcut
  run: () => void
}

/** Quick actions and pages for the command box. Each runs in the current page's context (modals open over it). */
export function useCommands(): { actions: Command[]; pages: Command[]; settings: Command[] } {
  const navigate = useNavigate()
  const newSale = useSaleModal().openNew
  const newInvoice = useInvoiceModal().openNew
  const openHelp = useOpenShortcutsHelp()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return useMemo(() => {
    const go = (to: string) => () => void navigate(to)

    const actions: Command[] = [
      { id: 'new-sale', label: 'New sale', icon: ReceiptTextIcon, keywords: ['add', 'client', 'create'], shortcut: ['N'], run: newSale },
      {
        id: 'new-expense',
        label: 'New expense',
        icon: WalletIcon,
        keywords: ['add', 'cost', 'bill', 'create'],
        shortcut: ['E'],
        run: go(addDialogHref('/expenses', 'expense')),
      },
      {
        id: 'new-invoice',
        label: 'New invoice',
        icon: FileTextIcon,
        keywords: ['add', 'create', 'bill'],
        shortcut: ['I'],
        run: () => newInvoice(),
      },
      {
        id: 'new-task',
        label: 'New task',
        icon: ListTodoIcon,
        keywords: ['add', 'todo', 'follow up', 'create'],
        shortcut: ['T'],
        run: go(addDialogHref('/tasks', 'task')),
      },
      {
        id: 'salaries',
        label: 'Add monthly salaries',
        icon: BanknoteIcon,
        keywords: ['pay', 'employees', 'salary'],
        run: go(addDialogHref('/expenses', 'salaries')),
      },
      {
        id: 'new-employee',
        label: 'New employee',
        icon: UserPlusIcon,
        keywords: ['add', 'person', 'staff', 'create'],
        run: go(addDialogHref('/employees', 'employee')),
      },
      {
        id: 'theme',
        label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
        icon: isDark ? SunIcon : MoonIcon,
        keywords: ['theme', 'dark', 'light', 'colour', 'color'],
        run: () => setTheme(isDark ? 'light' : 'dark'),
      },
      {
        id: 'shortcuts',
        label: 'Keyboard shortcuts',
        icon: KeyboardIcon,
        keywords: ['keys', 'hotkeys', 'help'],
        shortcut: ['?'],
        run: openHelp,
      },
    ]

    const pages: Command[] = NAV_ITEMS.map((item) => ({
      id: `page:${item.path}`,
      label: item.title,
      icon: item.icon,
      shortcut: ['G', item.key],
      run: go(item.path),
    }))

    const settings: Command[] = SETTINGS_NAV.flatMap((section) =>
      section.items.map((item) => ({
        id: `settings:${item.to}`,
        label: item.label,
        icon: SettingsIcon,
        keywords: ['settings', section.group],
        hint: 'Settings',
        run: go(item.to),
      })),
    )

    return { actions, pages, settings }
  }, [navigate, newSale, newInvoice, isDark, setTheme, openHelp])
}
