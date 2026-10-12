export type SettingsNavItem = { to: string; label: string }
export type SettingsNavSection = { group: string; items: SettingsNavItem[] }

/** Paths of each settings page, so other features can link straight to one. */
export const SETTINGS_PATHS = {
  tax: '/settings/tax',
  fxRates: '/settings/fx-rates',
  rtos: '/settings/rtos',
  courses: '/settings/courses',
  invoice: '/settings/invoice',
  backup: '/settings/backup',
} as const

export const SETTINGS_NAV: SettingsNavSection[] = [
  {
    group: 'Accounting',
    items: [
      { to: SETTINGS_PATHS.tax, label: 'Tax & shares' },
      { to: SETTINGS_PATHS.fxRates, label: 'Exchange rates' },
    ],
  },
  {
    group: 'Lists',
    items: [
      { to: SETTINGS_PATHS.rtos, label: 'RTOs' },
      { to: SETTINGS_PATHS.courses, label: 'Courses' },
    ],
  },
  {
    group: 'Invoices',
    items: [{ to: SETTINGS_PATHS.invoice, label: 'Invoice details' }],
  },
  {
    group: 'Data',
    items: [{ to: SETTINGS_PATHS.backup, label: 'Backup' }],
  },
]
