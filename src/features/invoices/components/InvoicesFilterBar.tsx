import { XIcon } from 'lucide-react'
import { FilterSelect } from '@/components/forms/FilterSelect'
import { SearchInput } from '@/components/forms/SearchInput'
import { Button } from '@/components/ui/button'
import type { InvoiceFilters } from '../filters'

const STATUS_OPTIONS = [
  { value: 'Due', label: 'Due' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Paid', label: 'Paid' },
]

export function InvoicesFilterBar({ filters, onChange }: { filters: InvoiceFilters; onChange: (patch: Partial<InvoiceFilters>) => void }) {
  const narrowed = filters.status !== 'all' || filters.search !== ''
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={filters.search}
        onChange={(search) => onChange({ search })}
        placeholder="Number, client, course…"
        label="Search invoices"
      />
      <FilterSelect
        label="Status"
        value={filters.status}
        onChange={(status) => onChange({ status: status as InvoiceFilters['status'] })}
        options={STATUS_OPTIONS}
      />
      {narrowed && (
        <Button variant="ghost" onClick={() => onChange({ status: 'all', search: '' })}>
          <XIcon />
          Clear
        </Button>
      )}
    </div>
  )
}
