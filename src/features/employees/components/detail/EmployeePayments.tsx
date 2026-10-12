import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { HandCoinsIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Amount } from '@/components/data/Amount'
import { DataTable } from '@/components/data/DataTable'
import { SectionEmpty } from '@/components/data/Section'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import type { Expense } from '@/features/expenses/api'
import { saleHref } from '@/features/sales/links'
import { formatBdt, formatDate, formatRate } from '@/lib/format'
import type { Cents } from '@/lib/money'

interface EmployeePaymentsProps {
  payments: Expense[]
  /** Totals for the footer. */
  total: { bdt: number; aud: Cents }
  empty: string
}

const Dash = () => <span className="text-muted-foreground/60">—</span>

/** Every salary and commission paid to them, newest first: the payment history. */
export function EmployeePayments({ payments, total, empty }: EmployeePaymentsProps) {
  const columns = useMemo<ColumnDef<Expense, unknown>[]>(
    () => [
      {
        id: 'spentOn',
        header: 'Date',
        accessorFn: (e) => e.spentOn,
        cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.spentOn)}</span>,
      },
      {
        id: 'category',
        header: 'Type',
        accessorFn: (e) => e.category,
        cell: ({ row }) =>
          row.original.category === 'Salary' ? (
            <StatusBadge tone="primary">Salary</StatusBadge>
          ) : (
            <StatusBadge tone="info">Commission</StatusBadge>
          ),
      },
      {
        id: 'for',
        header: 'For',
        accessorFn: (e) => e.saleClientName ?? e.description ?? '',
        cell: ({ row: { original: e } }) =>
          e.saleId ? (
            <Link to={saleHref(e.saleId)} className="font-semibold underline-offset-2 hover:underline">
              {e.saleClientName ?? 'Sale'}
            </Link>
          ) : (
            <span className="text-muted-foreground">{e.description ?? '—'}</span>
          ),
      },
      {
        id: 'bdt',
        header: 'Taka',
        accessorFn: (e) => e.bdt ?? 0,
        cell: ({ row: { original: e } }) => (e.bdt !== null ? <span className="money font-semibold">{formatBdt(e.bdt)}</span> : <Dash />),
        meta: { align: 'right' },
      },
      {
        id: 'rate',
        header: 'Rate',
        accessorFn: (e) => e.fxRate ?? 0,
        cell: ({ row: { original: e } }) =>
          e.fxRate !== null ? <span className="money text-muted-foreground">{formatRate(e.fxRate)}</span> : <Dash />,
        meta: { align: 'right' },
      },
      {
        id: 'aud',
        header: 'A$',
        accessorFn: (e) => e.amountAud,
        cell: ({ row }) => <Amount cents={row.original.amountAud} className="font-semibold text-danger" />,
        meta: { align: 'right' },
      },
    ],
    [],
  )

  return (
    <DataTable
      data={payments}
      columns={columns}
      getRowId={(e) => e.id}
      noun="payment"
      totals={{
        bdt: <span className="money">{formatBdt(total.bdt)}</span>,
        aud: <Amount cents={total.aud} />,
      }}
      empty={<SectionEmpty icon={HandCoinsIcon}>{empty}</SectionEmpty>}
    />
  )
}
