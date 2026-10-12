import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router'
import { saleHref } from '@/features/sales/links'
import { Amount } from '@/components/data/Amount'
import { DataTable } from '@/components/data/DataTable'
import { DataTableSkeleton } from '@/components/data/DataTableSkeleton'
import { formatDate } from '@/lib/format'
import { sumCents } from '@/lib/money'
import type { Invoice } from '../api/invoices'
import { invoiceStatus } from '../filters'
import { InvoiceStatusBadge, VersionBadge } from './InvoiceStatusBadge'

interface InvoicesTableProps {
  invoices: Invoice[]
  today: string
  onOpen: (invoice: Invoice) => void
}

/** Every column; `today` decides Due vs Overdue. */
function invoiceColumns(today: string): ColumnDef<Invoice, unknown>[] {
  return [
    {
      id: 'number',
      header: 'Invoice',
      accessorFn: (i) => i.number,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="money font-bold">{row.original.number}</span>
          <VersionBadge version={row.original.latest.version} />
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      accessorFn: (i) => i.latest.issuedOn,
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.latest.issuedOn)}</span>,
    },
    {
      id: 'client',
      header: 'Client',
      accessorFn: (i) => i.latest.billToName,
      meta: { skeleton: 'lines' },
      cell: ({ row }) => {
        const inv = row.original
        return (
          <div className="max-w-72 min-w-40">
            <p className="truncate font-medium">{inv.latest.billToName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {inv.saleId ? (
                <Link
                  to={saleHref(inv.saleId)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {inv.latest.items[0]?.description || 'Open sale'}
                </Link>
              ) : (
                inv.latest.items[0]?.description
              )}
            </p>
          </div>
        )
      },
    },
    {
      id: 'total',
      header: 'Total',
      accessorFn: (i) => i.latest.totals.total,
      cell: ({ getValue }) => <Amount cents={getValue() as number} className="font-semibold" />,
      meta: { align: 'right' },
    },
    {
      id: 'paid',
      header: 'Paid',
      accessorFn: (i) => i.latest.totals.paid,
      cell: ({ getValue }) => <Amount cents={getValue() as number} className="text-success" hideZero />,
      meta: { align: 'right' },
    },
    {
      id: 'due',
      header: 'Due',
      accessorFn: (i) => i.latest.totals.due,
      cell: ({ getValue }) => <Amount cents={getValue() as number} className="font-bold text-warning-foreground dark:text-warning" hideZero />,
      meta: { align: 'right' },
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (i) => invoiceStatus(i, today),
      meta: { skeleton: 'badge' },
      cell: ({ row }) => (
        <div className="leading-tight">
          <InvoiceStatusBadge status={invoiceStatus(row.original, today)} />
          {row.original.latest.totals.due > 0 && (
            <p className="mt-0.5 text-[11px] whitespace-nowrap text-muted-foreground">
              by {formatDate(row.original.latest.dueOn)}
            </p>
          )}
        </div>
      ),
    },
  ]
}

/** The invoices table while invoices load: the real headers, with rows shaped like the real ones. */
export function InvoicesTableSkeleton() {
  // Only headers and cell shapes are read (there are no rows), so `today` is never used.
  return <DataTableSkeleton columns={invoiceColumns('')} totals={['total', 'paid', 'due']} rows={10} />
}

/** One row per invoice number, showing its latest version. */
export function InvoicesTable({ invoices, today, onOpen }: InvoicesTableProps) {
  const columns = useMemo(() => invoiceColumns(today), [today])

  return (
    <DataTable
      data={invoices}
      columns={columns}
      getRowId={(i) => i.id}
      onRowClick={onOpen}
      noun="invoice"
      totals={{
        total: <Amount cents={sumCents(invoices, (i) => i.latest.totals.total)} />,
        paid: <Amount cents={sumCents(invoices, (i) => i.latest.totals.paid)} className="text-success" />,
        due: (
          <Amount
            cents={sumCents(invoices, (i) => i.latest.totals.due)}
            className="text-warning-foreground dark:text-warning"
          />
        ),
      }}
    />
  )
}
