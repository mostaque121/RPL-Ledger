import { useMemo, type ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Amount } from '@/components/data/Amount'
import { DataTable } from '@/components/data/DataTable'
import { DataTableSkeleton } from '@/components/data/DataTableSkeleton'
import { salesTotals } from '@/lib/accounting'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ViewItem } from '@/lib/view-prefs'
import type { SaleView } from '../api/sales'
import type { SaleColumnId } from '../view'
import { SaleBadges } from './SaleBadges'

const WARN = 'text-warning-foreground dark:text-warning'
const dash = <span className="text-muted-foreground/60">—</span>
const text = (value: string | null) => (value ? <span className="whitespace-nowrap">{value}</span> : dash)

/** A money column, right-aligned. */
const money = (
  id: SaleColumnId,
  header: string,
  value: (s: SaleView) => number,
  cell: (s: SaleView) => ReactNode,
): ColumnDef<SaleView, unknown> => ({ id, header, accessorFn: value, cell: ({ row }) => cell(row.original), meta: { align: 'right' } })

/** Every column the viewer can pick from (see `SALE_COLUMNS` for labels and defaults). */
const columns: ColumnDef<SaleView, unknown>[] = [
  {
    id: 'date',
    header: 'Date',
    accessorFn: (s) => s.saleDate,
    cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.saleDate)}</span>,
  },
  {
    id: 'client',
    header: 'Client',
    accessorFn: (s) => s.clientName.toLowerCase(),
    meta: { skeleton: 'lines' },
    cell: ({ row, table }) => (
      <div className="max-w-64 min-w-40">
        <p className="truncate font-semibold">{row.original.clientName}</p>
        {/* The course sits under the name, unless it has its own column. */}
        {!table.getColumn('course')?.getIsVisible() && (
          <p className="truncate text-xs text-muted-foreground">{row.original.courseName ?? 'No course'}</p>
        )}
      </div>
    ),
  },
  {
    id: 'course',
    header: 'Course',
    accessorFn: (s) => s.courseName ?? '',
    cell: ({ row }) => <span className="block max-w-56 truncate">{row.original.courseName ?? '—'}</span>,
  },
  { id: 'phone', header: 'Phone', accessorFn: (s) => s.phone ?? '', cell: ({ row }) => text(row.original.phone) },
  { id: 'email', header: 'Email', accessorFn: (s) => s.email ?? '', cell: ({ row }) => text(row.original.email) },
  { id: 'seller', header: 'Seller', accessorFn: (s) => s.sellerName, cell: ({ row }) => text(row.original.sellerName) },
  { id: 'rto', header: 'RTO', accessorFn: (s) => s.rtoName ?? '', cell: ({ row }) => text(row.original.rtoName) },
  { id: 'source', header: 'Source', accessorFn: (s) => s.source, cell: ({ row }) => text(row.original.source) },
  money(
    'fee',
    'Fee',
    (s) => s.courseFee,
    (s) => <Amount short cents={s.courseFee} className={s.cancelled ? 'text-muted-foreground line-through' : 'font-semibold'} />,
  ),
  money('rtoCost', 'RTO cost', (s) => s.rtoCost, (s) => <Amount short cents={s.rtoCost} className={cn(s.cancelled && 'text-muted-foreground line-through')} />),
  money('referral', 'Referral', (s) => s.referralCommission, (s) => <Amount short cents={s.referralCommission} hideZero />),
  money('collected', 'Paid', (s) => s.summary.collected, (s) => <Amount short cents={s.summary.collected} className="text-success" />),
  money('due', 'Due', (s) => s.summary.due, (s) => <Amount short cents={s.summary.due} className={cn('font-semibold', WARN)} hideZero />),
  money('rtoDue', 'RTO due', (s) => s.summary.rtoDue, (s) => <Amount short cents={s.summary.rtoDue} className="text-danger" hideZero />),
  money('hold', 'Hold', (s) => s.summary.hold, (s) => <Amount short cents={s.summary.hold} className={WARN} hideZero />),
  money('profit', 'Profit', (s) => s.summary.profit, (s) =>
    s.cancelled ? (
      <Amount short cents={0} hideZero />
    ) : (
      <Amount short cents={s.summary.profit} className={cn(s.summary.profit < 0 && 'text-danger', !s.completedOn && 'opacity-60')} />
    ),
  ),
  money('net', 'Net profit', (s) => s.summary.netProfit, (s) =>
    s.cancelled ? (
      <Amount short cents={0} hideZero />
    ) : (
      <Amount short cents={s.summary.netProfit} className={cn('font-bold', s.summary.netProfit < 0 && 'text-danger', !s.completedOn && 'opacity-60')} />
    ),
  ),
  {
    id: 'completed',
    header: 'Completed',
    accessorFn: (s) => s.completedOn ?? '',
    cell: ({ row }) => (row.original.completedOn ? text(formatDate(row.original.completedOn)) : dash),
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (s) => (s.cancelled ? 3 : s.completedOn ? 2 : s.summary.status === 'Paid' ? 1 : 0),
    cell: ({ row }) => <SaleBadges sale={row.original} />,
    meta: { skeleton: 'badge' },
  },
]

interface SalesTableProps {
  sales: SaleView[]
  onOpen: (sale: SaleView) => void
  /** The viewer's columns: order and which are shown. */
  view: readonly ViewItem<SaleColumnId>[]
  /** Search and filters, inside the table card. */
  toolbar?: ReactNode
  /** Shown in the card when no sale matches. */
  empty?: ReactNode
}

/** Footer columns with a total (see `totals` below). */
const TOTAL_IDS: readonly SaleColumnId[] = ['fee', 'rtoCost', 'referral', 'collected', 'due', 'rtoDue', 'hold', 'profit', 'net']

function useColumnView(view: readonly ViewItem<SaleColumnId>[]) {
  const columnOrder = useMemo(() => view.map((c) => c.id), [view])
  const columnVisibility = useMemo(() => Object.fromEntries(view.map((c) => [c.id, c.visible])), [view])
  return { columnOrder, columnVisibility }
}

/** The sales table while sales load: the viewer's own columns, with rows shaped like the real ones. */
export function SalesTableSkeleton({ view }: { view: readonly ViewItem<SaleColumnId>[] }) {
  const { columnOrder, columnVisibility } = useColumnView(view)
  // With its own Course column, the client cell is a single line.
  const shaped = columnVisibility.course
    ? columns.map((c) => (c.id === 'client' ? { ...c, meta: { skeleton: 'text' as const } } : c))
    : columns
  return <DataTableSkeleton columns={shaped} columnOrder={columnOrder} columnVisibility={columnVisibility} totals={TOTAL_IDS} rows={10} />
}

export function SalesTable({ sales, onOpen, view, toolbar, empty }: SalesTableProps) {
  const t = salesTotals(sales)
  const { columnOrder, columnVisibility } = useColumnView(view)

  return (
    <DataTable
      data={sales}
      columns={columns}
      getRowId={(s) => s.id}
      onRowClick={onOpen}
      rowClassName={(s) => s.cancelled && 'opacity-60'}
      noun="sale"
      columnOrder={columnOrder}
      columnVisibility={columnVisibility}
      toolbar={toolbar}
      empty={empty}
      totals={{
        fee: <Amount short cents={t.courseFee} />,
        rtoCost: <Amount short cents={t.rtoCost} />,
        referral: <Amount short cents={t.referralCommission} />,
        collected: <Amount short cents={t.collected} className="text-success" />,
        due: <Amount short cents={t.due} className={WARN} />,
        rtoDue: <Amount short cents={t.rtoDue} className="text-danger" />,
        hold: <Amount short cents={t.hold} className={WARN} />,
        profit: <Amount short cents={t.profit} />,
        net: <Amount short cents={t.netProfit} />,
      }}
    />
  )
}
