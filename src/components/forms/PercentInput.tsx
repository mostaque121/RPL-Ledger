import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PercentInputProps extends Omit<ComponentProps<typeof Input>, 'type'> {
  invalid?: boolean
}

/** Number field with a `%` suffix. Use with `register(name, { valueAsNumber: true })`. */
export function PercentInput({ invalid, className, ...props }: PercentInputProps) {
  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        aria-invalid={invalid}
        className={cn('money pr-8 text-right', className)}
        {...props}
      />
      <span className="pointer-events-none absolute inset-y-0 right-0 grid w-8 place-items-center text-sm font-semibold text-muted-foreground">
        %
      </span>
    </div>
  )
}
