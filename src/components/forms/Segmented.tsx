import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SegmentedProps<T extends string> {
  id?: string
  value: T | undefined
  onChange: (value: T) => void
  options: readonly { value: T; label: ReactNode }[]
  'aria-label'?: string
  className?: string
}

/** A row of mutually exclusive buttons (radio group), e.g. AUD | BDT. */
export function Segmented<T extends string>({ id, value, onChange, options, className, ...aria }: SegmentedProps<T>) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={aria['aria-label']}
      className={cn('grid gap-1 rounded-lg bg-secondary p-1 ring-1 ring-border ring-inset', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-semibold transition-colors sm:text-sm',
            value === o.value
              ? 'bg-card text-foreground shadow-sm ring-1 ring-foreground/10'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
