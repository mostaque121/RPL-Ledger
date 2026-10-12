import { addDays, format, parseISO } from 'date-fns'
import { XIcon } from 'lucide-react'
import { DatePicker } from '@/components/forms/DatePicker'
import { Button } from '@/components/ui/button'
import type { IsoDate } from '@/lib/accounting'
import { todayInSydney } from '@/lib/format'

const plusDays = (date: IsoDate, n: number) => format(addDays(parseISO(date), n), 'yyyy-MM-dd')

interface DueDateFieldProps {
  id?: string
  value: IsoDate | null
  onChange: (value: IsoDate | null) => void
}

/** Optional due date: one-click Today / Tomorrow / Next week, or any date. */
export function DueDateField({ id, value, onChange }: DueDateFieldProps) {
  const today = todayInSydney()
  const quick = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: plusDays(today, 1) },
    { label: 'Next week', date: plusDays(today, 7) },
  ]
  const isQuick = quick.some((q) => q.date === value)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {quick.map((q) => (
        <Button
          key={q.label}
          type="button"
          size="xs"
          variant={value === q.date ? 'default' : 'outline'}
          aria-pressed={value === q.date}
          onClick={() => onChange(value === q.date ? null : q.date)}
        >
          {q.label}
        </Button>
      ))}
      <DatePicker
        id={id}
        value={isQuick ? null : value}
        onChange={onChange}
        placeholder="Date…"
        className="h-6 w-auto px-2 text-xs [&_svg]:size-3"
      />
      {value && (
        <Button type="button" size="icon-xs" variant="ghost" aria-label="No due date" onClick={() => onChange(null)}>
          <XIcon />
        </Button>
      )}
    </div>
  )
}
