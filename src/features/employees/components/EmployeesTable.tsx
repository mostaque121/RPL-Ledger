import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckIcon, EllipsisIcon, PencilIcon, PowerIcon, Trash2Icon } from 'lucide-react'
import { DataTable } from '@/components/data/DataTable'
import { DataTableSkeleton } from '@/components/data/DataTableSkeleton'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { bdtToAud } from '@/lib/accounting'
import { formatAud, formatBdt } from '@/lib/format'
import type { Person } from '../api'
import type { PayRate } from '../rates'
import type { EmployeeMonth } from '../stats'

export interface EmployeeRow extends Person {
  /** Figures for the selected month; null while sales / expenses load. */
  stats: (EmployeeMonth & { owed: number; owedBdt: number }) | null
  /** Pay in force in the selected month (see `rateForMonth`), not necessarily today's. */
  monthPay: PayRate | null
}

interface EmployeesTableProps {
  employees: EmployeeRow[]
  /** The selected month's AUD→BDT rate, for AUD estimates. Null hides them. */
  rate: number | null
  onOpen: (person: EmployeeRow) => void
  onEdit: (person: Person) => void
  onToggleActive: (person: Person) => void
  onDelete: (person: Person) => void
}

const Dash = () => <span className="text-muted-foreground">—</span>

function BdtAmount({ taka, rate }: { taka: number | null; rate: number | null }) {
  if (taka === null) return <Dash />
  return (
    <div className="leading-tight">
      <p className="money font-bold">{formatBdt(taka)}</p>
      {rate !== null && <p className="money text-[11px] text-muted-foreground">≈ {formatAud(bdtToAud(taka, rate))}</p>}
    </div>
  )
}

type RowActions = Pick<EmployeesTableProps, 'onEdit' | 'onToggleActive' | 'onDelete'>

/** Every column; `rate` gives the A$ estimates under the taka amounts. */
function employeeColumns(rate: number | null, { onEdit, onToggleActive, onDelete }: RowActions): ColumnDef<EmployeeRow, unknown>[] {
  return [
    {
      id: 'name',
      header: 'Name',
      accessorFn: (e) => e.name.toLowerCase(),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          <span className="font-semibold">{row.original.name}</span>
          {!row.original.active && (
            <StatusBadge tone="muted" className="ml-2">
              Inactive
            </StatusBadge>
          )}
        </span>
      ),
    },
    {
      id: 'sales',
      header: 'Sales',
      accessorFn: (e) => e.stats?.sales ?? 0,
      cell: ({ row }) => <span className="money font-bold">{row.original.stats?.sales ?? '…'}</span>,
      meta: { align: 'right' },
    },
    {
      id: 'completed',
      header: 'Completed',
      accessorFn: (e) => e.stats?.completed ?? 0,
      cell: ({ row }) => <span className="money">{row.original.stats?.completed ?? '…'}</span>,
      meta: { align: 'right' },
    },
    {
      id: 'salary',
      header: 'Salary',
      meta: { align: 'right', skeleton: 'amountLines' },
      accessorFn: (e) => (e.stats?.salary.count ? e.stats.salary.bdt : (e.monthPay?.salaryBdt ?? 0)),
      cell: ({ row }) => {
        const e = row.original
        // Paid: what was actually paid that month. Not paid: the salary in force that month.
        const paid = !!e.stats && e.stats.salary.count > 0
        const taka = paid ? e.stats!.salary.bdt : (e.monthPay?.salaryBdt ?? null)
        return (
          <div className="flex items-center justify-end gap-2">
            <BdtAmount taka={taka} rate={rate} />
            {e.stats && taka !== null && (
              <StatusBadge tone={paid ? 'success' : 'muted'}>
                {paid ? (
                  <>
                    <CheckIcon className="mr-0.5 size-3" />
                    Paid
                  </>
                ) : (
                  'Not paid'
                )}
              </StatusBadge>
            )}
          </div>
        )
      },
    },
    {
      id: 'commission',
      header: 'Per sale',
      meta: { align: 'right', skeleton: 'amountLines' },
      accessorFn: (e) => e.monthPay?.commissionPerSaleBdt ?? 0,
      cell: ({ row }) => <BdtAmount taka={row.original.monthPay?.commissionPerSaleBdt ?? null} rate={rate} />,
    },
    {
      id: 'owed',
      header: 'Commission owed',
      accessorFn: (e) => e.stats?.owedBdt ?? 0,
      cell: ({ row }) => {
        const e = row.original
        if (!e.stats || e.stats.owed === 0) return <Dash />
        return (
          <div className="leading-tight">
            <p className="money font-bold text-warning-foreground dark:text-warning">
              {formatBdt(e.stats.owedBdt)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {e.stats.owed} sale{e.stats.owed === 1 ? '' : 's'}
            </p>
          </div>
        )
      },
      meta: { align: 'right' },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      meta: { skeleton: 'icon' },
      cell: ({ row }) => {
        const e = row.original
        return (
          <div className="flex justify-end" onClick={(ev) => ev.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${e.name}`}>
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(e)}>
                  <PencilIcon />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onToggleActive(e)}>
                  <PowerIcon />
                  {e.active ? 'Deactivate' : 'Reactivate'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={e.historyCount > 0} onSelect={() => onDelete(e)}>
                  <Trash2Icon />
                  {e.historyCount > 0 ? 'Delete (has history)' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}

// Only headers and cell shapes are read while loading (there are no rows), so these are never used.
const noop = () => {}
const SKELETON_COLUMNS = employeeColumns(null, { onEdit: noop, onToggleActive: noop, onDelete: noop })

/** The employees table while their figures load: the real headers, with rows shaped like the real ones. */
export function EmployeesTableSkeleton({ rows = 4 }: { rows?: number }) {
  return <DataTableSkeleton columns={SKELETON_COLUMNS} rows={rows} />
}

export function EmployeesTable({ employees, rate, onOpen, onEdit, onToggleActive, onDelete }: EmployeesTableProps) {
  const columns = useMemo(
    () => employeeColumns(rate, { onEdit, onToggleActive, onDelete }),
    [rate, onEdit, onToggleActive, onDelete],
  )

  return (
    <DataTable
      data={employees}
      columns={columns}
      getRowId={(e) => e.id}
      onRowClick={onOpen}
      rowClassName={(e) => !e.active && 'opacity-60'}
    />
  )
}
