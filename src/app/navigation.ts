import {
  FileTextIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  ReceiptTextIcon,
  ScrollTextIcon,
  SettingsIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  path: string
  icon: LucideIcon
  /** Where the top-bar back arrow on a sub-page (e.g. `/sales/<id>`) goes, when not opened from a list. */
  backTo?: string
  /** "G" then this key opens the page. */
  key: string
}

/** Sidebar items. Routes are defined in `router.tsx` with the same paths. */
export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', key: 'D', path: '/', icon: LayoutDashboardIcon },
  { title: 'Sales', key: 'S', path: '/sales', icon: ReceiptTextIcon, backTo: '/sales?month=all' },
  { title: 'Tasks', key: 'T', path: '/tasks', icon: ListTodoIcon },
  { title: 'Invoices', key: 'I', path: '/invoices', icon: FileTextIcon },
  { title: 'Expenses', key: 'E', path: '/expenses', icon: WalletIcon },
  { title: 'Employees', key: 'P', path: '/employees', icon: UsersIcon },
  { title: 'Statement', key: 'M', path: '/statement', icon: ScrollTextIcon },
  { title: 'Settings', key: ',', path: '/settings', icon: SettingsIcon },
]

export function navItemFor(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) =>
    item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`),
  )
}
