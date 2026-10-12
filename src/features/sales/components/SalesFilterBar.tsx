import { FilterToolbar } from '@/components/data/FilterToolbar'
import type { CustomizerSection } from '@/components/data/ViewCustomizer'
import type { FilterOption } from '@/components/forms/FilterSelect'
import { MonthFilter } from '@/components/forms/MonthFilter'
import type { SalesFilters } from '../filters'
import { SALE_SOURCES } from '../schema'
import { FILTER_FIELD, type SaleFilterId } from '../view'

interface SalesFilterBarProps {
  filters: SalesFilters
  onChange: (patch: Partial<SalesFilters>) => void
  /** The filters the viewer chose to show, in their order. */
  visible: readonly SaleFilterId[]
  sellers: FilterOption[]
  rtos: FilterOption[]
  courses: FilterOption[]
  /** Columns and filters for "Customize". */
  customize: CustomizerSection[]
}

const STATIC_OPTIONS = {
  payment: [
    { value: 'due', label: 'Owes money' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Partial', label: 'Partial' },
    { value: 'Paid', label: 'Paid' },
  ],
  state: [
    { value: 'open', label: 'Open' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  rtoPay: [{ value: 'due', label: 'RTO not paid' }],
  source: SALE_SOURCES.map((s) => ({ value: s, label: s })),
} as const satisfies Partial<Record<SaleFilterId, readonly FilterOption[]>>

/** Short labels on the filter chips (the customizer uses the longer ones). */
const SHORT_LABEL: Record<SaleFilterId, string> = {
  seller: 'Seller',
  rto: 'RTO',
  course: 'Course',
  source: 'Source',
  payment: 'Payment',
  state: 'State',
  rtoPay: 'RTO pay',
}

const CLEARED = Object.fromEntries(Object.values(FILTER_FIELD).map((f) => [f, 'all'])) as Partial<SalesFilters>

/** Above the sales table: search, filters, month and "Customize" (see `FilterToolbar`). */
export function SalesFilterBar({ filters, onChange, visible, sellers, rtos, courses, customize }: SalesFilterBarProps) {
  const options: Record<SaleFilterId, readonly FilterOption[]> = { ...STATIC_OPTIONS, seller: sellers, rto: rtos, course: courses }

  return (
    <FilterToolbar
      storageKey="sales"
      search={filters.search}
      onSearch={(search) => onChange({ search })}
      searchPlaceholder="Search client, phone, course…"
      searchLabel="Search sales"
      filters={visible.map((id) => ({
        id,
        label: SHORT_LABEL[id],
        value: filters[FILTER_FIELD[id]],
        options: options[id],
        onChange: (value) => onChange({ [FILTER_FIELD[id]]: value }),
      }))}
      onClear={() => onChange(CLEARED)}
      right={<MonthFilter value={filters.month} onChange={(month) => onChange({ month })} />}
      customize={customize}
    />
  )
}
