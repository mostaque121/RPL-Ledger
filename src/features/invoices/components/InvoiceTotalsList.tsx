import { Amount } from '@/components/data/Amount'
import type { InvoiceTotals } from '@/lib/accounting'
import { cn } from '@/lib/utils'

/** Total → GST inside it → paid → due, the same order as on the PDF. */
export function InvoiceTotalsList({ totals, gstIncluded, className }: { totals: InvoiceTotals; gstIncluded: boolean; className?: string }) {
  return (
    <dl className={cn('space-y-1.5 text-sm', className)}>
      <div className="flex justify-between gap-4">
        <dt className="font-semibold">Total</dt>
        <dd>
          <Amount cents={totals.total} className="font-bold" />
        </dd>
      </div>
      {gstIncluded && (
        <div className="flex justify-between gap-4 text-xs text-muted-foreground">
          <dt>Includes GST</dt>
          <dd>
            <Amount cents={totals.gst} />
          </dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Paid</dt>
        <dd>
          <Amount cents={totals.paid} className="text-success" />
        </dd>
      </div>
      <div className="flex justify-between gap-4 border-t pt-1.5">
        <dt className="font-bold">Amount due</dt>
        <dd>
          <Amount cents={totals.due} className={cn('font-extrabold', totals.due > 0 ? 'text-warning-foreground dark:text-warning' : 'text-success')} />
        </dd>
      </div>
    </dl>
  )
}
