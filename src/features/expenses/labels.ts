import type { StatusTone } from '@/components/feedback/StatusBadge'
import type { ExpenseSplit, Settings } from '@/lib/accounting'
import type { ExpenseCategory } from '@/types/db'

/** "Shared 60/40", "Tanvir only", "MD only". Plain "Shared" while the settings load. */
export function splitLabel(split: ExpenseSplit, settings: Pick<Settings, 'tanvirShare'> | undefined): string {
  if (split === 'tanvir') return 'Tanvir only'
  if (split === 'md') return 'MD only'
  return settings ? `Shared ${settings.tanvirShare}/${100 - settings.tanvirShare}` : 'Shared'
}

export const SPLIT_TONE: Record<ExpenseSplit, StatusTone> = { shared: 'muted', tanvir: 'primary', md: 'info' }

export const CATEGORY_TONE: Record<ExpenseCategory, StatusTone> = {
  Ads: 'info',
  Software: 'primary',
  Phone: 'primary',
  Salary: 'warning',
  'Employee commission': 'warning',
  'Lead cost': 'info',
  Other: 'muted',
}
