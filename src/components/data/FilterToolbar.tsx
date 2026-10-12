import { useState, type ReactNode } from 'react'
import { ListFilterIcon, PencilIcon, XIcon } from 'lucide-react'
import { FilterChip } from '@/components/forms/FilterChip'
import type { FilterOption } from '@/components/forms/FilterSelect'
import { SearchInput } from '@/components/forms/SearchInput'
import { Button } from '@/components/ui/button'
import { useStoredFlag } from '@/hooks/use-stored-flag'
import { cn } from '@/lib/utils'
import { ViewCustomizer, type CustomizerSection } from './ViewCustomizer'

/** One compact filter in the filter row. `all` = not set. */
export interface ToolbarFilter {
  id: string
  label: string
  value: string
  options: readonly FilterOption[]
  onChange: (value: string) => void
}

interface FilterToolbarProps {
  /** Remembers (per browser) whether the filter row is open, e.g. `sales`. */
  storageKey: string
  search: string
  onSearch: (value: string) => void
  searchPlaceholder: string
  searchLabel: string
  /** The filters to show, in the viewer's order. */
  filters: readonly ToolbarFilter[]
  onClear: () => void
  /** Extra controls on the right, before "Customize" (e.g. a month picker). */
  right?: ReactNode
  /** Sections for "Customize". The ✎ in the filter row opens the one keyed `filters`. */
  customize: CustomizerSection[]
}

/**
 * A list page's toolbar: search and a "Filters" toggle on the left, extra controls and
 * "Customize" on the right, then (when toggled on) a row of compact filters.
 */
export function FilterToolbar({
  storageKey,
  search,
  onSearch,
  searchPlaceholder,
  searchLabel,
  filters,
  onClear,
  right,
  customize,
}: FilterToolbarProps) {
  const [showFilters, setShowFilters] = useStoredFlag(`${storageKey}:filters-open`, true)
  const [customizing, setCustomizing] = useState(false)
  const [customizeTab, setCustomizeTab] = useState(customize[0]?.key ?? '')
  const set = filters.filter((f) => f.value !== 'all').length

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={onSearch} placeholder={searchPlaceholder} label={searchLabel} className="sm:w-72" />
        <Button
          variant="outline"
          aria-pressed={showFilters}
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && 'bg-muted')}
        >
          <ListFilterIcon />
          Filters
          {set > 0 && <span className="money rounded-full bg-primary px-1.5 text-[11px] leading-4.5 font-bold text-primary-foreground">{set}</span>}
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {right && (
            <>
              {right}
              <span aria-hidden className="mx-1 hidden h-6 w-px bg-border sm:block" />
            </>
          )}
          <ViewCustomizer
            sections={customize}
            open={customizing}
            onOpenChange={setCustomizing}
            tab={customizeTab}
            onTabChange={setCustomizeTab}
          />
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-0.5">
          {filters.map((f) => (
            <FilterChip key={f.id} label={f.label} value={f.value} onChange={f.onChange} options={f.options} />
          ))}
          {filters.length > 0 && <span aria-hidden className="mx-1.5 h-5 w-px bg-border" />}
          {customize.some((s) => s.key === 'filters') && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-full border"
              aria-label="Choose filters"
              title="Choose which filters show"
              onClick={() => {
                setCustomizeTab('filters')
                setCustomizing(true)
              }}
            >
              <PencilIcon />
            </Button>
          )}
          {set > 0 && (
            <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={onClear}>
              <XIcon />
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
