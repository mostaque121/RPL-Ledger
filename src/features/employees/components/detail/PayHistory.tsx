import { useState } from 'react'
import { HistoryIcon, Trash2Icon } from 'lucide-react'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatBdt, formatDate, todayInSydney } from '@/lib/format'
import { useDeletePayMutation, type Person } from '../../api'
import { rateOn, type PayRate } from '../../rates'

const taka = (v: number | null) => (v === null ? '—' : formatBdt(v))

/**
 * Every pay change, newest first, with the one in force today marked. Removing a change makes the
 * one before it apply again (the only remaining rate can't be removed).
 */
export function PayHistory({ employee }: { employee: Person }) {
  const remove = useDeletePayMutation()
  const [deleting, setDeleting] = useState<PayRate | null>(null)
  const today = todayInSydney()
  const current = rateOn(employee.rates, today)
  const newestFirst = [...employee.rates].reverse()

  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <HistoryIcon className="size-4 text-primary" />
        Pay history
      </h3>

      {newestFirst.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">No pay set yet. Use "Edit pay".</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-table-head text-[11px] font-bold tracking-wider text-table-head-foreground/75 uppercase">
              <tr>
                <th className="px-3 py-2 text-left">From</th>
                <th className="px-3 py-2 text-right">Salary</th>
                <th className="px-3 py-2 text-right">Per sale</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {newestFirst.map((r, i) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {/* The oldest rate also covers everything before it. */}
                    {i === newestFirst.length - 1 && newestFirst.length > 1 ? 'Start' : formatDate(r.effectiveFrom)}
                    {r.id === current?.id && (
                      <StatusBadge tone="success" className="ml-2">
                        Current
                      </StatusBadge>
                    )}
                    {r.effectiveFrom > today && (
                      <StatusBadge tone="info" className="ml-2">
                        Upcoming
                      </StatusBadge>
                    )}
                  </td>
                  <td className="money px-3 py-2 text-right">{taka(r.salaryBdt)}</td>
                  <td className="money px-3 py-2 text-right">{taka(r.commissionPerSaleBdt)}</td>
                  <td className="px-1 py-1 text-right">
                    {employee.rates.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="hover:text-danger"
                        aria-label={`Remove the pay change from ${formatDate(r.effectiveFrom)}`}
                        onClick={() => setDeleting(r)}
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Salaries and commissions use the pay in force on their date. Expenses already added keep their amount.
      </p>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Remove the pay change from ${formatDate(deleting.effectiveFrom)}?` : ''}
        description="The pay before it applies again from that date. Salary and commission expenses already added don't change."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => deleting && remove.mutateAsync(deleting.id)}
      />
    </section>
  )
}
