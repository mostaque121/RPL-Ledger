import { useState } from 'react'
import { BanIcon, CircleCheckBigIcon, EllipsisIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { monthOf } from '@/lib/accounting'
import { formatDate, formatMonth } from '@/lib/format'
import {
  useDeleteSaleMutation,
  useSetCancelledMutation,
  useSetCompletedMutation,
  type SaleView,
} from '../../api/sales'
import { SaleBadges } from '../SaleBadges'
import { useSaleModal } from '../../hooks/use-sale-modal'
import { CompleteDialog } from './CompleteDialog'
import { Panel } from './Panel'
import { QuickActions, QuickActionsSkeleton } from './QuickActions'

interface SaleIdentityProps {
  sale: SaleView
  /** After the sale is deleted (leave the page). */
  onDeleted: () => void
  /** A quick action opened its dialog (note, task, payment). */
  onQuickAction?: (what: 'note' | 'task' | 'payment') => void
}

type Confirm = 'reopen' | 'cancel' | 'restore' | 'delete' | null

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

/** The header card while the sale loads: avatar, name, course line and badge, then the quick actions. */
export function SaleIdentitySkeleton() {
  return (
    <Panel className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-1">
          <SkeletonText size="base" className="w-40" />
          <SkeletonText className="w-52 max-w-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <QuickActionsSkeleton className="border-y py-3" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </Panel>
  )
}

/** Who the client is, the quick actions, and what can be done with the sale. Top of the left column. */
export function SaleIdentity({ sale, onDeleted, onQuickAction }: SaleIdentityProps) {
  const saleModal = useSaleModal()
  const [completing, setCompleting] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const setCompleted = useSetCompletedMutation()
  const setCancelled = useSetCancelledMutation()
  const remove = useDeleteSaleMutation()
  const paymentCount = sale.payments.length + sale.rtoPayments.length

  const confirmCopy = {
    reopen: {
      title: 'Reopen this sale?',
      description: `Its profit will no longer count in ${sale.completedOn ? formatMonth(monthOf(sale.completedOn)) : 'that month'}.${sale.commission ? ' The commission expense stays; remove it from the Payments tab if needed.' : ''}`,
      label: 'Reopen',
      run: () => setCompleted.mutateAsync({ id: sale.id, completedOn: null }),
    },
    cancel: {
      title: `Cancel the sale to ${sale.clientName}?`,
      description:
        'It will have no profit, due or hold. Payments already made still count as cash; add a negative payment for any refund.',
      label: 'Cancel sale',
      run: () => setCancelled.mutateAsync({ id: sale.id, cancelled: true }),
    },
    restore: {
      title: 'Restore this sale?',
      description: 'It becomes an open sale again.',
      label: 'Restore',
      run: () => setCancelled.mutateAsync({ id: sale.id, cancelled: false }),
    },
    delete: {
      title: `Delete the sale to ${sale.clientName}?`,
      description:
        paymentCount > 0
          ? `Its ${paymentCount} payment${paymentCount === 1 ? '' : 's'}, notes and tasks will be deleted too. Use "Cancel sale" instead if it really happened. This can't be undone.`
          : "Its notes and tasks go with it. Only for sales entered by mistake. This can't be undone.",
      label: 'Delete',
      run: async () => {
        await remove.mutateAsync(sale.id)
        onDeleted()
      },
    },
  } as const
  const active = confirm ? confirmCopy[confirm] : null

  return (
    <Panel className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-base font-extrabold text-primary-foreground"
        >
          {initials(sale.clientName) || '?'}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-lg leading-tight font-extrabold tracking-tight wrap-break-word">{sale.clientName}</h2>
          <p className="text-sm text-muted-foreground">
            {[sale.courseName ?? 'No course', sale.rtoName].filter(Boolean).join(' · ')}
          </p>
          <SaleBadges sale={sale} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="-mr-1.5 -mt-1" aria-label="More actions">
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => saleModal.openEdit(sale.id)}>
              <PencilIcon />
              Edit sale
            </DropdownMenuItem>
            {sale.completedOn && (
              <DropdownMenuItem onSelect={() => setConfirm('reopen')}>
                <RotateCcwIcon />
                Reopen
              </DropdownMenuItem>
            )}
            {sale.cancelled ? (
              <DropdownMenuItem onSelect={() => setConfirm('restore')}>
                <RotateCcwIcon />
                Restore sale
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setConfirm('cancel')}>
                <BanIcon />
                Cancel sale
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirm('delete')}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <QuickActions sale={sale} onOpen={onQuickAction} className="border-y py-3" />

      {!sale.cancelled &&
        (sale.completedOn ? (
          <div className="flex items-center gap-2 rounded-lg bg-info/10 px-3 py-2 text-sm ring-1 ring-info/25 ring-inset">
            <CircleCheckBigIcon className="size-4 shrink-0 text-info" />
            <span className="flex-1">
              Completed <span className="font-semibold">{formatDate(sale.completedOn)}</span>
            </span>
            <Button variant="ghost" size="xs" onClick={() => setConfirm('reopen')}>
              Reopen
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={() => setCompleting(true)}>
            <CircleCheckBigIcon />
            Mark completed
          </Button>
        ))}

      {completing && <CompleteDialog open onOpenChange={setCompleting} sale={sale} />}
      <ConfirmDialog
        open={active !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={active?.title ?? ''}
        description={active?.description}
        confirmLabel={active?.label}
        tone={confirm === 'delete' || confirm === 'cancel' ? 'danger' : 'default'}
        onConfirm={() => active?.run()}
      />
    </Panel>
  )
}
