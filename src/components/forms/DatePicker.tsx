import { useState, type ReactNode } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate, todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  id?: string
  /** `yyyy-MM-dd`, or null when empty. */
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  /** Replaces the trigger's icon and text, e.g. an inline-edit value. */
  trigger?: ReactNode
  'aria-label'?: string
}

/** Date field showing `dd MMM yyyy`, with a "Today" shortcut (Sydney time). */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  invalid,
  className,
  trigger,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  function pick(date: string | null) {
    onChange(date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          aria-label={ariaLabel}
          className={cn('w-full justify-start font-normal', !value && 'text-muted-foreground', className)}
        >
          {trigger ?? (
            <>
              <CalendarIcon className="text-muted-foreground" />
              {value ? formatDate(value) : placeholder}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          onSelect={(date) => pick(date ? format(date, 'yyyy-MM-dd') : null)}
        />
        <div className="border-t p-2">
          <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => pick(todayInSydney())}>
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
