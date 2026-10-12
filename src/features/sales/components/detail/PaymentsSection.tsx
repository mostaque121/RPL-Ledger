import { useState, type ReactNode } from 'react'
import { CalendarIcon, PencilIcon, Trash2Icon, type LucideIcon } from 'lucide-react'
import { AddButton, LIST_CARD, SectionEmpty, SectionHeader } from '@/components/data/Section'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { formatAudShort, formatDate } from '@/lib/format'
import type { Cents } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useDeletePaymentMutation, type PaymentKind } from '../../api/payments'
import type { RtoPayment } from '../../api/sales'
import { PaymentDialog } from './PaymentDialog'

const TONE = {
  client: { section: 'success', amount: 'text-success' },
  rto: { section: 'danger', amount: 'text-danger' },
} as const

const WARN = 'text-warning-foreground dark:text-warning'

interface PaymentsSectionProps {
  kind: PaymentKind
  title: string
  icon: LucideIcon
  saleId: string
  clientName: string
  payments: (Partial<RtoPayment> & { id: string; paidOn: string; amount: Cents })[]
  /** Still owed; prefilled when adding. */
  outstanding: Cents
  addLabel: string
  agencies?: string[]
  /** e.g. "Fully paid on 05 Mar 2026". */
  footnote?: ReactNode
}

/** A list of client payments or RTO payments with add / edit / delete. */
export function PaymentsSection({
  kind,
  title,
  icon,
  saleId,
  clientName,
  payments,
  outstanding,
  addLabel,
  agencies,
  footnote,
}: PaymentsSectionProps) {
  const [editing, setEditing] = useState<PaymentsSectionProps['payments'][number] | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PaymentsSectionProps['payments'][number] | null>(null)
  const remove = useDeletePaymentMutation()
  const tone = TONE[kind]

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={icon}
        tone={tone.section}
        title={title}
        count={payments.length}
        action={<AddButton onClick={() => setEditing('new')}>{addLabel}</AddButton>}
      />

      {payments.length === 0 ? (
        <SectionEmpty icon={icon}>
          Nothing yet.
          {outstanding > 0 && (
            <span>
              Still owed: <span className="money font-semibold text-foreground">{formatAudShort(outstanding)}</span>
            </span>
          )}
        </SectionEmpty>
      ) : (
        <ul className="space-y-2">
          {payments.map((p) => (
            <li key={p.id} className={cn('group flex items-center gap-3', LIST_CARD)}>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <CalendarIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {formatDate(p.paidOn)}
                  {p.agency && (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground">{p.agency}</span>
                  )}
                  {p.amount < 0 && <span className={cn('text-[11px] font-bold uppercase', WARN)}>Refund</span>}
                </p>
                {p.note && <p className="truncate text-xs text-muted-foreground">{p.note}</p>}
              </div>
              <span className={cn('money text-base font-bold', p.amount < 0 ? WARN : tone.amount)}>{formatAudShort(p.amount)}</span>
              <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setEditing(p)}>
                  <PencilIcon />
                </Button>
                <Button variant="ghost" size="icon-sm" className="hover:text-danger" aria-label="Delete" onClick={() => setDeleting(p)}>
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {footnote && <p className="text-xs text-muted-foreground">{footnote}</p>}

      {editing && (
        <PaymentDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          kind={kind}
          saleId={saleId}
          clientName={clientName}
          payment={editing === 'new' ? undefined : editing}
          suggested={outstanding}
          agencies={agencies}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete the ${formatAudShort(deleting.amount)} payment from ${formatDate(deleting.paidOn)}?` : ''}
        description="Totals, due and hold update straight away. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => deleting && remove.mutateAsync({ kind, id: deleting.id })}
      />
    </section>
  )
}
