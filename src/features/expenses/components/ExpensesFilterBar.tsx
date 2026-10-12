import { FilterToolbar } from '@/components/data/FilterToolbar'
import type { CustomizerSection } from '@/components/data/ViewCustomizer'
import type { FilterOption } from '@/components/forms/FilterSelect'
import { MonthFilter } from '@/components/forms/MonthFilter'
import type { Settings } from '@/lib/accounting'
import type { ExpenseFilters } from '../filters'
import { splitLabel } from '../labels'
import { EXPENSE_CATEGORIES, EXPENSE_SPLITS } from '../schema'
import { EXPENSE_FILTER_FIELD, type ExpenseFilterId } from '../view'

interface ExpensesFilterBarProps {
  filters: ExpenseFilters
  onChange: (patch: Partial<ExpenseFilters>) => void
  /** The filters the viewer chose to show, in their order. */
  visible: readonly ExpenseFilterId[]
  employees: FilterOption[]
  /** For the split labels ("Shared 60/40"); plain labels until it loads. */
  settings: Settings | undefined
  customize: CustomizerSection[]
}

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))
const CURRENCY_OPTIONS = [
  { value: 'AUD', label: 'AUD' },
  { value: 'BDT', label: 'BDT (salaries, commissions)' },
]

/** Short labels on the filter chips (the customizer uses the longer ones). */
const SHORT_LABEL: Record<ExpenseFilterId, string> = {
  category: 'Category',
  split: 'Split',
  employee: 'Employee',
  currency: 'Currency',
}

const CLEARED = Object.fromEntries(Object.values(EXPENSE_FILTER_FIELD).map((f) => [f, 'all'])) as Partial<ExpenseFilters>

/** Above the expenses table: search, filters, month and "Customize" (see `FilterToolbar`). */
export function ExpensesFilterBar({ filters, onChange, visible, employees, settings, customize }: ExpensesFilterBarProps) {
  const options: Record<ExpenseFilterId, readonly FilterOption[]> = {
    category: CATEGORY_OPTIONS,
    split: EXPENSE_SPLITS.map((s) => ({ value: s, label: splitLabel(s, settings) })),
    employee: employees,
    currency: CURRENCY_OPTIONS,
  }

  return (
    <FilterToolbar
      storageKey="expenses"
      search={filters.search}
      onSearch={(search) => onChange({ search })}
      searchPlaceholder="Search description, employee…"
      searchLabel="Search expenses"
      filters={visible.map((id) => ({
        id,
        label: SHORT_LABEL[id],
        value: filters[EXPENSE_FILTER_FIELD[id]],
        options: options[id],
        onChange: (value) => onChange({ [EXPENSE_FILTER_FIELD[id]]: value }),
      }))}
      onClear={() => onChange(CLEARED)}
      right={<MonthFilter value={filters.month} onChange={(month) => onChange({ month })} />}
      customize={customize}
    />
  )
}
