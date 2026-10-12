import { useDeferredValue, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CircleCheckIcon,
  FileTextIcon,
  ListTodoIcon,
  ReceiptTextIcon,
  UserIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, Kbd } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { usePeopleQuery } from '@/features/employees/api'
import { employeeHref } from '@/features/employees/links'
import { useExpensesQuery } from '@/features/expenses/api'
import { useInvoicesQuery } from '@/features/invoices/api/invoices'
import { InvoiceStatusBadge } from '@/features/invoices/components/InvoiceStatusBadge'
import { invoiceStatus } from '@/features/invoices/filters'
import { useSalesQuery } from '@/features/sales/api/sales'
import { useSaleTasksQuery } from '@/features/sales/api/tasks'
import { DueChip } from '@/features/sales/components/crm/DueChip'
import { SaleBadges } from '@/features/sales/components/SaleBadges'
import { saleHref } from '@/features/sales/links'
import { formatAudShort, formatDate, todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCommands, type Command as PaletteCommand } from '../hooks/use-commands'
import { matches, searchRecords, tokenize } from '../search'
import { ShortcutKeys } from './ShortcutKeys'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Search everything and run quick actions (Ctrl / ⌘ + K). The body mounts only while open, so nothing loads until it's used. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[10svh] translate-y-0 gap-0 overflow-hidden p-0 sm:top-[14svh] sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Search sales, invoices, employees, tasks and expenses, or run a quick action.</DialogDescription>
        <PaletteBody onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

/** Recent sales shown before anything is typed. */
const RECENT = 5

function PaletteBody({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  // Typing stays instant; the search catches up a frame later on a slow phone.
  const deferred = useDeferredValue(query)
  const tokens = useMemo(() => tokenize(deferred), [deferred])
  const searching = tokens.length > 0

  const sales = useSalesQuery()
  const invoices = useInvoicesQuery()
  const people = usePeopleQuery()
  const tasks = useSaleTasksQuery()
  const expenses = useExpensesQuery()
  const loading = [sales, invoices, people, tasks, expenses].some((q) => q.isPending)
  const { actions, pages, settings } = useCommands()
  const today = todayInSydney()

  const results = useMemo(
    () =>
      searchRecords(deferred, {
        sales: sales.data,
        invoices: invoices.data,
        people: people.data,
        tasks: tasks.data,
        expenses: expenses.data,
      }),
    [deferred, sales.data, invoices.data, people.data, tasks.data, expenses.data],
  )

  const recent = useMemo(
    () => (sales.data ?? []).slice().sort((a, b) => b.saleDate.localeCompare(a.saleDate)).slice(0, RECENT),
    [sales.data],
  )

  const pick = (fields: PaletteCommand) => matches(tokens, [fields.label, ...(fields.keywords ?? [])])
  const shownActions = searching ? actions.filter(pick) : actions
  const shownPages = searching ? [...pages, ...settings].filter(pick) : pages

  /** Close first, so a modal the command opens isn't fighting this dialog for focus. */
  const run = (fn: () => void) => () => {
    onDone()
    fn()
  }
  const go = (to: string) => run(() => void navigate(to))
  const q = encodeURIComponent(deferred.trim())

  const commandItem = (c: PaletteCommand) => (
    <CommandItem key={c.id} value={c.id} onSelect={run(c.run)}>
      <Tile icon={c.icon} />
      <span className="flex-1 truncate font-medium">{c.label}</span>
      {c.hint && <span className="text-xs text-muted-foreground">{c.hint}</span>}
      {c.shortcut && <ShortcutKeys keys={c.shortcut} className="max-sm:hidden" />}
    </CommandItem>
  )

  const saleItems = searching ? results.sales.items : recent

  return (
    // Filtering and ranking are ours (`searchRecords`), so cmdk only handles the keyboard.
    <Command shouldFilter={false} loop>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search clients, phones, invoices, tasks… or type a command" />
      <CommandList>
        <CommandEmpty>{loading ? 'Loading…' : `Nothing found for “${deferred.trim()}”.`}</CommandEmpty>

        {shownActions.length > 0 && <CommandGroup heading="Quick actions">{shownActions.map(commandItem)}</CommandGroup>}

        {saleItems.length > 0 && (
          <CommandGroup heading={searching ? 'Sales' : 'Recent sales'}>
            {saleItems.map((s) => (
              <CommandItem key={s.id} value={`sale:${s.id}`} onSelect={go(saleHref(s.id))}>
                <Tile icon={ReceiptTextIcon} />
                <Text title={s.clientName} sub={[s.courseName ?? 'No course', s.phone, formatDate(s.saleDate)]} />
                <SaleBadges sale={s} />
              </CommandItem>
            ))}
            <SeeAll total={results.sales.total} shown={saleItems.length} noun="sale" onSelect={go(`/sales?month=all&search=${q}`)} />
          </CommandGroup>
        )}

        {results.invoices.items.length > 0 && (
          <CommandGroup heading="Invoices">
            {results.invoices.items.map((i) => (
              <CommandItem key={i.id} value={`invoice:${i.id}`} onSelect={go(`/invoices?invoice=${i.id}`)}>
                <Tile icon={FileTextIcon} tone="info" />
                <Text title={<span className="money">{i.number}</span>} sub={[i.latest.billToName, formatDate(i.latest.issuedOn)]} />
                <InvoiceStatusBadge status={invoiceStatus(i, today)} />
              </CommandItem>
            ))}
            <SeeAll total={results.invoices.total} shown={results.invoices.items.length} noun="invoice" onSelect={go(`/invoices?search=${q}`)} />
          </CommandGroup>
        )}

        {results.employees.items.length > 0 && (
          <CommandGroup heading="Employees">
            {results.employees.items.map((p) => (
              <CommandItem key={p.id} value={`employee:${p.id}`} onSelect={go(employeeHref(p.id))}>
                <Tile icon={UserIcon} />
                <Text title={p.name} sub={['Employee']} />
                {!p.active && <StatusBadge tone="muted">Inactive</StatusBadge>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.tasks.items.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.tasks.items.map((t) => (
              <CommandItem
                key={t.id}
                value={`task:${t.id}`}
                onSelect={go(t.saleId ? saleHref(t.saleId) : `/tasks?tab=all&search=${encodeURIComponent(t.title)}`)}
              >
                <Tile icon={t.doneAt ? CircleCheckIcon : ListTodoIcon} tone={t.doneAt ? 'success' : 'primary'} />
                <Text
                  title={<span className={cn(t.doneAt && 'text-muted-foreground line-through')}>{t.title}</span>}
                  sub={[t.clientName ?? 'General task']}
                  subIcon={t.saleId ? undefined : BriefcaseIcon}
                />
                {t.dueOn && !t.doneAt && <DueChip dueOn={t.dueOn} today={today} />}
              </CommandItem>
            ))}
            <SeeAll total={results.tasks.total} shown={results.tasks.items.length} noun="task" onSelect={go(`/tasks?tab=all&search=${q}`)} />
          </CommandGroup>
        )}

        {results.expenses.items.length > 0 && (
          <CommandGroup heading="Expenses">
            {results.expenses.items.map((e) => (
              <CommandItem
                key={e.id}
                value={`expense:${e.id}`}
                onSelect={go(`/expenses?month=${e.spentOn.slice(0, 7)}&search=${encodeURIComponent(e.description ?? e.employeeName ?? '')}`)}
              >
                <Tile icon={WalletIcon} tone="danger" />
                <Text title={e.description ?? e.employeeName ?? e.category} sub={[e.category, formatDate(e.spentOn)]} />
                <span className="money text-sm font-bold text-danger">{formatAudShort(e.amountAud)}</span>
              </CommandItem>
            ))}
            <SeeAll total={results.expenses.total} shown={results.expenses.items.length} noun="expense" onSelect={go(`/expenses?month=all&search=${q}`)} />
          </CommandGroup>
        )}

        {shownPages.length > 0 && (
          <>
            {!searching && <CommandSeparator />}
            <CommandGroup heading="Go to">{shownPages.map(commandItem)}</CommandGroup>
          </>
        )}
      </CommandList>

      <div className="hidden items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground sm:flex">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          move
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>Enter</Kbd>
          open
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>Esc</Kbd>
          close
        </span>
      </div>
    </Command>
  )
}

const TILE_TONES = {
  primary: 'bg-accent text-accent-foreground',
  info: 'bg-info/15 text-info',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
} as const

function Tile({ icon: Icon, tone = 'primary' }: { icon: LucideIcon; tone?: keyof typeof TILE_TONES }) {
  return (
    <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', TILE_TONES[tone])}>
      <Icon className="size-4" />
    </span>
  )
}

/** Title over a small detail line (empty parts left out). */
function Text({ title, sub, subIcon: SubIcon }: { title: ReactNode; sub: (string | null | undefined)[]; subIcon?: LucideIcon }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate font-semibold">{title}</span>
      <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
        {SubIcon && <SubIcon className="size-3" />}
        {sub.filter(Boolean).join(' · ')}
      </span>
    </span>
  )
}

/** "See all 23 sales" when the list was cut short; opens the page with the same search. */
function SeeAll({ total, shown, noun, onSelect }: { total: number; shown: number; noun: string; onSelect: () => void }) {
  if (total <= shown) return null
  return (
    <CommandItem value={`all:${noun}`} onSelect={onSelect} className="text-primary">
      <span className="grid size-8 shrink-0 place-items-center">
        <ArrowRightIcon className="size-4" />
      </span>
      <span className="font-semibold">
        See all {total} {noun}s
      </span>
    </CommandItem>
  )
}
