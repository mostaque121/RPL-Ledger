import { useState, type ComponentProps } from 'react'
import { FileTextIcon, ListTodoIcon, MailIcon, NotebookPenIcon, PhoneIcon, WalletIcon, type LucideIcon } from 'lucide-react'
import { useInvoicesQuery } from '@/features/invoices/api/invoices'
import { useInvoiceModal } from '@/features/invoices/hooks/use-invoice-modal'
import { cn } from '@/lib/utils'
import type { SaleView } from '../../api/sales'
import { NoteDialog } from '../crm/NoteDialog'
import { TaskDialog } from '../crm/TaskDialog'
import { PaymentDialog } from './PaymentDialog'

const ITEM =
  'group/qa flex min-w-0 flex-col items-center gap-1.5 rounded-lg py-1 text-[11px] font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-40'
const CIRCLE =
  'grid size-10 place-items-center rounded-full border border-input bg-card text-foreground shadow-xs transition-colors group-hover/qa:border-primary group-hover/qa:bg-primary group-hover/qa:text-primary-foreground group-focus-visible/qa:ring-3 group-focus-visible/qa:ring-ring/50'

function Inner({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <>
      <span className={CIRCLE}>
        <Icon className="size-4" />
      </span>
      <span className="max-w-full truncate">{label}</span>
    </>
  )
}

/** A round action: a link (call, email) or a button. Without `href` and `onClick` it shows disabled. */
function QuickAction({ icon, label, href, title, ...rest }: { icon: LucideIcon; label: string; href?: string } & ComponentProps<'button'>) {
  if (href)
    return (
      <a href={href} title={title} className={ITEM}>
        <Inner icon={icon} label={label} />
      </a>
    )
  return (
    <button type="button" title={title} className={ITEM} disabled={!rest.onClick} {...rest}>
      <Inner icon={icon} label={label} />
    </button>
  )
}

const ACTIONS = [
  { icon: PhoneIcon, label: 'Call' },
  { icon: MailIcon, label: 'Email' },
  { icon: NotebookPenIcon, label: 'Note' },
  { icon: ListTodoIcon, label: 'Task' },
  { icon: FileTextIcon, label: 'Invoice' },
  { icon: WalletIcon, label: 'Payment' },
] as const

/** The six actions while the sale loads: in place, but not clickable yet. */
export function QuickActionsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-6 gap-1', className)}>
      {ACTIONS.map(({ icon, label }) => (
        <QuickAction key={label} icon={icon} label={label} />
      ))}
    </div>
  )
}

type Open = 'note' | 'task' | 'payment' | null

interface QuickActionsProps {
  sale: SaleView
  /** Called when a dialog opens, so the page can show the matching tab behind it. */
  onOpen?: (what: Exclude<Open, null>) => void
  className?: string
}

/** Call, email, note, task, invoice, payment: the six things done most often with a client. */
export function QuickActions({ sale, onOpen, className }: QuickActionsProps) {
  const [open, setOpenState] = useState<Open>(null)
  const setOpen = (what: Open) => {
    setOpenState(what)
    if (what) onOpen?.(what)
  }
  const close = (o: boolean) => !o && setOpenState(null)
  const invoices = useInvoicesQuery()
  const modal = useInvoiceModal()
  const latestInvoice = (invoices.data ?? []).find((i) => i.saleId === sale.id)

  return (
    <div className={cn('grid grid-cols-6 gap-1', className)}>
      <QuickAction
        icon={PhoneIcon}
        label="Call"
        href={sale.phone ? `tel:${sale.phone.replace(/\s/g, '')}` : undefined}
        title={sale.phone ? `Call ${sale.phone}` : 'No phone number saved'}
      />
      <QuickAction
        icon={MailIcon}
        label="Email"
        href={sale.email ? `mailto:${sale.email}` : undefined}
        title={sale.email ? `Email ${sale.email}` : 'No email saved'}
      />
      <QuickAction icon={NotebookPenIcon} label="Note" title="Write a note" onClick={() => setOpen('note')} />
      <QuickAction icon={ListTodoIcon} label="Task" title="Add a task" onClick={() => setOpen('task')} />
      <QuickAction
        icon={FileTextIcon}
        label="Invoice"
        title={latestInvoice ? `Update invoice ${latestInvoice.number}` : 'Create an invoice'}
        onClick={invoices.isPending ? undefined : () => (latestInvoice ? modal.openUpdate(latestInvoice.id) : modal.openNew(sale.id))}
      />
      <QuickAction icon={WalletIcon} label="Payment" title="Add a client payment" onClick={() => setOpen('payment')} />

      {open === 'note' && <NoteDialog saleId={sale.id} onOpenChange={close} />}
      {open === 'task' && <TaskDialog saleId={sale.id} onOpenChange={close} />}
      {open === 'payment' && (
        <PaymentDialog
          open
          onOpenChange={close}
          kind="client"
          saleId={sale.id}
          clientName={sale.clientName}
          suggested={sale.cancelled ? 0 : sale.summary.due}
        />
      )}
    </div>
  )
}
