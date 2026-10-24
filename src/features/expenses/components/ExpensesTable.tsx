import { useMemo, type ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Link } from 'react-router'
import { saleHref } from '@/features/sales/links'
import { Amount } from '@/components/data/Amount'
import { DataTable } from '@/components/data/DataTable'
import { DataTableSkeleton } from '@/components/data/DataTableSkeleton'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { Button } from '@/components/ui/button'
import { expenseSplit, expenseTotals, type Settings } from '@/lib/accounting'
import { formatBdt, formatDate, formatRate } from '@/lib/format'
import type { ViewItem } from '@/lib/view-prefs'
import type { Expense } from '../api'
import { CATEGORY_TONE, SPLIT_TONE, splitLabel } from '../labels'
import type { ExpenseColumnId } from '../view'

interface ExpensesTableProps {
  expenses: Expense[]
  settings: Settings
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
  /** The viewer's columns: order and which are shown. Edit / delete always stay last. */
  view: readonly ViewItem<ExpenseColumnId>[]
  /** Shown in the card when no expense matches. */
  empty?: ReactNode
}

const dash = <span className="text-muted-foreground/60">—</span>

/** Every column. Cells need the settings and the row handlers, so the list is built per table. */
function expenseColumns(
  settings: Settings,
  onEdit: (expense: Expense) => void,
  onDelete: (expense: Expense) => void,
): ColumnDef<Expense, unknown>[] {
  return [
    {
      id: 'date',
      header: 'Date',
      accessorFn: (e) => e.spentOn,
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.spentOn)}</span>,
    },
    {
      id: 'category',
      header: 'Category',
      accessorFn: (e) => e.category,
      meta: { skeleton: 'badge' },
      cell: ({ row }) => <StatusBadge tone={CATEGORY_TONE[row.original.category]}>{row.original.category}</StatusBadge>,
    },
    {
      id: 'details',
      header: 'Details',
      enableSorting: false,
      meta: { skeleton: 'lines' },
      cell: ({ row }) => {
        const e = row.original
        return (
          <div className="max-w-72 min-w-40">
            <p className="truncate font-medium">{e.description ?? e.employeeName ?? '—'}</p>
            {(e.employeeName || e.saleId) && (
              <p className="truncate text-xs text-muted-foreground">
                {e.description && e.employeeName}
                {e.saleId && (
                  <>
                    {e.description && e.employeeName && ' · '}
                    <Link
                      to={saleHref(e.saleId)}
                      onClick={(ev) => ev.stopPropagation()}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      Sale: {e.saleClientName ?? 'open'}
                    </Link>
                  </>
                )}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: 'employee',
      header: 'Employee',
      accessorFn: (e) => e.employeeName ?? '',
      cell: ({ row }) => (row.original.employeeName ? <span className="whitespace-nowrap">{row.original.employeeName}</span> : dash),
    },
    {
      id: 'sale',
      header: 'Sale',
      accessorFn: (e) => e.saleClientName ?? '',
      cell: ({ row }) => {
        const e = row.original
        if (!e.saleId) return dash
        return (
          <Link
            to={saleHref(e.saleId)}
            onClick={(ev) => ev.stopPropagation()}
            className="whitespace-nowrap text-primary underline-offset-2 hover:underline"
          >
            {e.saleClientName ?? 'Open sale'}
          </Link>
        )
      },
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorFn: (e) => e.amountAud,
      cell: ({ row }) => {
        const e = row.original
        return (
          <div className="leading-tight">
            <Amount cents={e.amountAud} className="font-bold text-danger" />
            {e.bdt !== null && (
              <p className="money text-[11px] text-muted-foreground">
                {formatBdt(e.bdt)} @ {e.fxRate !== null ? formatRate(e.fxRate) : '—'}
              </p>
            )}
          </div>
        )
      },
      meta: { align: 'right' },
    },
    {
      id: 'split',
      header: 'Split',
      accessorFn: (e) => e.split,
      meta: { skeleton: 'badge' },
      cell: ({ row }) => (
        <StatusBadge tone={SPLIT_TONE[row.original.split]}>{splitLabel(row.original.split, settings)}</StatusBadge>
      ),
    },
    {
      id: 'tanvir',
      header: 'Tanvir',
      accessorFn: (e) => expenseSplit(e, settings).tanvir,
      cell: ({ getValue }) => <Amount cents={getValue() as number} hideZero />,
      meta: { align: 'right' },
    },
    {
      id: 'md',
      header: 'MD',
      accessorFn: (e) => expenseSplit(e, settings).md,
      cell: ({ getValue }) => <Amount cents={getValue() as number} hideZero />,
      meta: { align: 'right' },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      meta: { skeleton: 'icons' },
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(ev) => ev.stopPropagation()}>
          <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => onEdit(row.original)}>
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hover:text-danger"
            aria-label="Delete"
            onClick={() => onDelete(row.original)}
          >
            <Trash2Icon />
          </Button>
        </div>
      ),
    },
  ]
}

/** The viewer's order and visibility; edit / delete always stay last. */
function useColumnView(view: readonly ViewItem<ExpenseColumnId>[]) {
  const columnOrder = useMemo(() => [...view.map((c) => c.id), 'actions'], [view])
  const columnVisibility = useMemo(() => Object.fromEntries(view.map((c) => [c.id, c.visible])), [view])
  return { columnOrder, columnVisibility }
}

// Only headers and cell shapes are read while loading (there are no rows), so these are never used.
const noop = () => {}
const SKELETON_COLUMNS = expenseColumns({ taxPct: 0, tanvirShare: 0 }, noop, noop)

/** The expenses table while expenses load: the viewer's own columns, with rows shaped like the real ones. */
export function ExpensesTableSkeleton({ view }: { view: readonly ViewItem<ExpenseColumnId>[] }) {
  const { columnOrder, columnVisibility } = useColumnView(view)
  return (
    <DataTableSkeleton
      columns={SKELETON_COLUMNS}
      columnOrder={columnOrder}
      columnVisibility={columnVisibility}
      totals={['amount', 'tanvir', 'md']}
      rows={10}
      fill
    />
  )
}

export function ExpensesTable({ expenses, settings, onEdit, onDelete, view, empty }: ExpensesTableProps) {
  const { columnOrder, columnVisibility } = useColumnView(view)
  const columns = useMemo(() => expenseColumns(settings, onEdit, onDelete), [settings, onEdit, onDelete])

  const t = expenseTotals(expenses, settings)

  return (
    <DataTable
      data={expenses}
      columns={columns}
      getRowId={(e) => e.id}
      onRowClick={onEdit}
      noun="expense"
      columnOrder={columnOrder}
      columnVisibility={columnVisibility}
      empty={empty}
      fill
      totals={{
        amount: <Amount cents={t.total} className="text-danger" />,
        tanvir: <Amount cents={t.split.tanvir} />,
        md: <Amount cents={t.split.md} />,
      }}
    />
  )
}
