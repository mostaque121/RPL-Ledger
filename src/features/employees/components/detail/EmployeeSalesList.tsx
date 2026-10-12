import type { ColumnDef } from '@tanstack/react-table'
import { ReceiptTextIcon } from 'lucide-react'
import { Amount } from '@/components/data/Amount'
import { DataTable } from '@/components/data/DataTable'
import { DataTableSkeleton } from '@/components/data/DataTableSkeleton'
import { SectionEmpty } from '@/components/data/Section'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import type { SaleView } from '@/features/sales/api/sales'
import { SaleBadges } from '@/features/sales/components/SaleBadges'
import { salesTotals } from '@/lib/accounting'
import { formatBdt, formatDate } from '@/lib/format'

interface EmployeeSalesListProps {
  sales: SaleView[]
  onOpen: (sale: SaleView) => void
  empty: string
}

const Dash = () => <span className="text-muted-foreground/60">—</span>

const columns: ColumnDef<SaleView, unknown>[] = [
  {
    id: 'client',
    header: 'Client',
    accessorFn: (s) => s.clientName.toLowerCase(),
    meta: { skeleton: 'lines' },
    cell: ({ row: { original: s } }) => (
      <div className="min-w-40 leading-tight">
        <p className="font-semibold">{s.clientName}</p>
        <p className="text-xs text-muted-foreground">{[s.courseName ?? 'No course', s.rtoName].filter(Boolean).join(' · ')}</p>
      </div>
    ),
  },
  {
    id: 'saleDate',
    header: 'Sold',
    accessorFn: (s) => s.saleDate,
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.saleDate)}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (s) => (s.cancelled ? 'z' : s.summary.status),
    meta: { skeleton: 'badge' },
    cell: ({ row: { original: s } }) => (
      <div className="leading-tight">
        <SaleBadges sale={s} />
        {s.completedOn && <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(s.completedOn)}</p>}
      </div>
    ),
  },
  {
    id: 'fee',
    header: 'Fee',
    accessorFn: (s) => s.courseFee,
    cell: ({ row }) => <Amount cents={row.original.courseFee} short />,
    meta: { align: 'right' },
  },
  {
    id: 'due',
    header: 'Due',
    accessorFn: (s) => (s.cancelled ? 0 : s.summary.due),
    cell: ({ row: { original: s } }) =>
      s.cancelled ? <Dash /> : <Amount cents={s.summary.due} short hideZero className="font-semibold text-warning-foreground dark:text-warning" />,
    meta: { align: 'right' },
  },
  {
    id: 'netProfit',
    header: 'Net profit',
    accessorFn: (s) => (s.cancelled ? 0 : s.summary.netProfit),
    cell: ({ row: { original: s } }) =>
      s.cancelled ? <Dash /> : <Amount cents={s.summary.netProfit} short className={s.completedOn ? 'font-semibold text-success' : 'text-muted-foreground'} />,
    meta: { align: 'right' },
  },
  {
    id: 'commission',
    header: 'Commission',
    accessorFn: (s) => s.commission?.bdt ?? 0,
    cell: ({ row: { original: s } }) => {
      if (s.commission) return <span className="money font-semibold">{s.commission.bdt ? formatBdt(s.commission.bdt) : <Amount cents={s.commission.aud} short />}</span>
      if (s.completedOn && !s.cancelled) return <StatusBadge tone="warning">Owed</StatusBadge>
      return <Dash />
    },
    meta: { align: 'right' },
  },
]

/** Footer columns with a total (see `totals` below). */
const TOTAL_IDS = ['fee', 'due', 'netProfit'] as const

/** The list while their sales load: the real headers, with rows shaped like the real ones. */
export function EmployeeSalesListSkeleton() {
  return <DataTableSkeleton columns={columns} totals={TOTAL_IDS} rows={6} />
}

/** Their sales with what each one is worth and whether the commission was paid. */
export function EmployeeSalesList({ sales, onOpen, empty }: EmployeeSalesListProps) {
  const totals = salesTotals(sales)

  return (
    <DataTable
      data={sales}
      columns={columns}
      getRowId={(s) => s.id}
      onRowClick={onOpen}
      rowClassName={(s) => s.cancelled && 'opacity-60'}
      noun="sale"
      totals={{
        fee: <Amount cents={totals.courseFee} short />,
        due: <Amount cents={totals.due} short hideZero />,
        netProfit: <Amount cents={totals.netProfit} short />,
      }}
      empty={<SectionEmpty icon={ReceiptTextIcon}>{empty}</SectionEmpty>}
    />
  )
}
