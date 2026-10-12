import { ChevronDownIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { FilterOption } from './FilterSelect'

interface FilterChipProps {
  label: string
  /** `all` = not filtered. */
  value: string
  onChange: (value: string) => void
  options: readonly FilterOption[]
}

/** A compact filter: bold text with a caret ("Seller ▾"), which shows its value once set ("Seller: Reaz ▾"). */
export function FilterChip({ label, value, onChange, options }: FilterChipProps) {
  const active = value !== 'all'
  const selected = options.find((o) => o.value === value)?.label

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-7 max-w-60 items-center gap-1 rounded-md px-2 text-[13px] font-semibold whitespace-nowrap outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted',
          active && 'bg-accent text-accent-foreground hover:bg-accent/80 data-[state=open]:bg-accent',
        )}
      >
        {label}
        {active && <span className="truncate font-medium">: {selected ?? value}</span>}
        <ChevronDownIcon className="size-3 shrink-0 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 min-w-44 overflow-y-auto">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
