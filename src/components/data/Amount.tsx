import { formatAud, formatAudShort } from '@/lib/format'
import type { Cents } from '@/lib/money'
import { cn } from '@/lib/utils'

interface AmountProps {
  cents: Cents
  className?: string
  /** A dash for zero or less. */
  hideZero?: boolean
  /** `$1,234` instead of `$1,234.00` (cents still show when there are any). */
  short?: boolean
}

/** A dollar figure in the money font. */
export function Amount({ cents, className, hideZero, short }: AmountProps) {
  if (hideZero && cents <= 0) return <span className="money text-muted-foreground/60">—</span>
  return <span className={cn('money', className)}>{(short ? formatAudShort : formatAud)(cents)}</span>
}
