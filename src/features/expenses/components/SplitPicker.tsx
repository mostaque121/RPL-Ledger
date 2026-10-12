import { Segmented } from '@/components/forms/Segmented'
import { expenseSplit, type ExpenseSplit, type Settings } from '@/lib/accounting'
import { formatAud } from '@/lib/format'
import type { Cents } from '@/lib/money'
import { splitLabel } from '../labels'
import { EXPENSE_SPLITS } from '../schema'

interface SplitPickerProps {
  id?: string
  value: ExpenseSplit
  onChange: (value: ExpenseSplit) => void
  settings: Settings
  /** The expense in AUD, to show each partner's part. Null hides it. */
  amountAud: Cents | null
}

/** Who pays: shared / Tanvir only / MD only, with each partner's part. */
export function SplitPicker({ id, value, onChange, settings, amountAud }: SplitPickerProps) {
  const parts = amountAud ? expenseSplit({ amountAud, split: value }, settings) : null
  return (
    <div className="space-y-2">
      <Segmented
        id={id}
        aria-label="Who pays"
        value={value}
        onChange={onChange}
        options={EXPENSE_SPLITS.map((split) => ({ value: split, label: splitLabel(split, settings) }))}
      />
      {parts && (
        <p className="flex justify-between text-xs text-muted-foreground">
          <span>
            Tanvir pays <span className="money font-bold text-foreground">{formatAud(parts.tanvir)}</span>
          </span>
          <span>
            MD pays <span className="money font-bold text-foreground">{formatAud(parts.md)}</span>
          </span>
        </p>
      )}
    </div>
  )
}
