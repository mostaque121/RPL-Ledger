import { useState } from 'react'
import { CalendarRangeIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { Month } from '@/lib/accounting'
import { currentMonth, formatMonth } from '@/lib/format'
import { addMonths } from '@/lib/month'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface MonthPickerProps {
  id?: string
  /** `yyyy-MM` */
  value: Month
  onChange: (value: Month) => void
  /** Show ‹ › buttons to step one month at a time (good for page filters). */
  stepper?: boolean
  disabled?: boolean
  invalid?: boolean
  className?: string
}

/** Pick a month: a year header and a 12-month grid. Optional ‹ › stepper around it. */
export function MonthPicker({ id, value, onChange, stepper = false, disabled, invalid, className }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => Number(value.slice(0, 4)))
  const today = currentMonth()

  function handleOpenChange(next: boolean) {
    if (next) setYear(Number(value.slice(0, 4)))
    setOpen(next)
  }

  const trigger = (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn('justify-start font-semibold', stepper ? 'min-w-32' : 'w-full', className)}
        >
          <CalendarRangeIcon className="text-muted-foreground" />
          {formatMonth(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
            <ChevronLeftIcon />
          </Button>
          <span className="money text-sm font-bold">{year}</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
            <ChevronRightIcon />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTH_LABELS.map((label, i) => {
            const month = `${year}-${String(i + 1).padStart(2, '0')}`
            const selected = month === value
            return (
              <Button
                key={month}
                type="button"
                size="sm"
                variant={selected ? 'default' : 'ghost'}
                className={cn(!selected && month === today && 'ring-1 ring-primary/50')}
                onClick={() => {
                  onChange(month)
                  setOpen(false)
                }}
              >
                {label}
              </Button>
            )
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(today)
            setOpen(false)
          }}
        >
          This month
        </Button>
      </PopoverContent>
    </Popover>
  )

  if (!stepper) return trigger

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => onChange(addMonths(value, -1))} aria-label="Previous month">
        <ChevronLeftIcon />
      </Button>
      {trigger}
      <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => onChange(addMonths(value, 1))} aria-label="Next month">
        <ChevronRightIcon />
      </Button>
    </div>
  )
}
