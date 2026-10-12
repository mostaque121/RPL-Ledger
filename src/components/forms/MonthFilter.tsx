import { MonthPicker } from '@/components/forms/MonthPicker'
import { Button } from '@/components/ui/button'
import type { Month } from '@/lib/accounting'
import { currentMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MonthFilterProps {
  /** A month, or `all` for every month. */
  value: Month | 'all'
  onChange: (value: Month | 'all') => void
}

/** ‹ month › stepper plus an "All months" toggle, for list pages. */
export function MonthFilter({ value, onChange }: MonthFilterProps) {
  const all = value === 'all'
  return (
    <>
      <div className={cn(all && 'opacity-60')}>
        <MonthPicker stepper value={all ? currentMonth() : value} onChange={onChange} />
      </div>
      <Button variant={all ? 'default' : 'outline'} aria-pressed={all} onClick={() => onChange(all ? currentMonth() : 'all')}>
        All months
      </Button>
    </>
  )
}
