import { useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { amountToText, parseAmount } from '@/lib/money'
import { cn } from '@/lib/utils'

const SYMBOL = { AUD: '$', BDT: '৳' } as const

interface MoneyInputProps extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'defaultValue'> {
  /** Integer minor units (cents for AUD, poisha for BDT). `null` when empty. */
  value: number | null
  onChange: (value: number | null) => void
  currency?: keyof typeof SYMBOL
  /** Overrides the currency symbol, e.g. `$` on client-facing forms. */
  symbol?: string
  allowNegative?: boolean
}

/** Zero shows as an empty field (with the `0` placeholder), so typing never has to clear it. */
const toText = (minor: number | null) => (minor === 0 ? '' : amountToText(minor))

/**
 * Money field. Shows the currency symbol, accepts `1,234.50`, and reports integer minor units.
 * Invalid text reports `null`, so the form's Zod schema shows the error.
 */
export function MoneyInput({
  value,
  onChange,
  currency = 'AUD',
  symbol,
  allowNegative = false,
  className,
  onBlur,
  placeholder = '0',
  ...props
}: MoneyInputProps) {
  const [text, setText] = useState(() => toText(value))
  // The last value this field reported. Anything else means the form changed it (reset, prefill).
  const [reported, setReported] = useState(value)
  if (value !== reported) {
    setReported(value)
    setText(toText(value))
  }

  function handleChange(next: string) {
    const amount = parseAmount(next)
    const valid = amount !== null && amount < 0 && !allowNegative ? null : amount
    setText(next)
    setReported(valid)
    onChange(valid)
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 grid w-9 place-items-center text-sm font-semibold text-muted-foreground">
        {symbol ?? SYMBOL[currency]}
      </span>
      <Input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={(e) => {
          if (value !== null) setText(toText(value))
          onBlur?.(e)
        }}
        className={cn('money pl-9', className)}
        {...props}
      />
    </div>
  )
}
