import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  label: string
  /** `all` = not filtered. */
  value: string
  onChange: (value: string) => void
  options: readonly FilterOption[]
}

/** "Seller: All" style select. The trigger is highlighted while a filter is set. */
export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  const active = value !== 'all'
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn('min-w-28', active && 'border-primary bg-accent font-semibold text-accent-foreground')}
      >
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        <SelectItem value="all">All</SelectItem>
        <SelectSeparator />
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
