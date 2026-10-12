import { useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import type { CellSkeleton } from './DataTableSkeleton'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { BODY_CELL, FOOT_CELL, HEAD_CELL, HEAD_ROW, TABLE_CARD } from './table-styles'

declare module '@tanstack/react-table' {
  // The type parameters must match TanStack's own declaration.
  // oxlint-disable-next-line no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'right'
    /** The cell's shape while the table loads (see `DataTableSkeleton`). */
    skeleton?: CellSkeleton
  }
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  getRowId: (row: T) => string
  /** Click / Enter on a row. */
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | false | undefined
  /** Footer cells by column id. The first column shows the row count. */
  totals?: Partial<Record<string, ReactNode>>
  /** e.g. "sale" gives "12 sales" in the footer. */
  noun?: string
  /** Column ids in display order (the viewer's choice). Columns left out keep their place after these. */
  columnOrder?: string[]
  /** Hidden columns are `false`. */
  columnVisibility?: VisibilityState
  /** Search / filters, shown inside the card above the table. */
  toolbar?: ReactNode
  /** Shown in the card instead of the table when there are no rows. */
  empty?: ReactNode
}

const alignRight = (meta: { align?: 'right' } | undefined) => meta?.align === 'right' && 'text-right'

/** Sortable table in the app's card style, with an optional totals footer. */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  rowClassName,
  totals,
  noun = 'row',
  columnOrder,
  columnVisibility,
  toolbar,
  empty,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  // The React Compiler isn't used here, so TanStack Table's non-memoisable API is fine.
  // oxlint-disable-next-line react/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, ...(columnOrder && { columnOrder }), ...(columnVisibility && { columnVisibility }) },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
  })

  const grid = (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className={HEAD_ROW}>
              {group.headers.map((header) => {
                const meta = header.column.columnDef.meta
                const sorted = header.column.getIsSorted()
                const Icon = sorted === 'asc' ? ArrowUpIcon : sorted === 'desc' ? ArrowDownIcon : ArrowUpDownIcon
                const label = flexRender(header.column.columnDef.header, header.getContext())
                return (
                  <TableHead
                    key={header.id}
                    className={cn(HEAD_CELL, alignRight(meta))}
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          'inline-flex items-center gap-1 uppercase hover:text-table-head-foreground',
                          meta?.align === 'right' && 'flex-row-reverse',
                          sorted && 'text-table-head-foreground',
                        )}
                      >
                        {label}
                        <Icon className={cn('size-3', !sorted && 'opacity-40')} />
                      </button>
                    ) : (
                      label
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick && (() => onRowClick(row.original))}
              onKeyDown={
                onRowClick && ((e) => e.key === 'Enter' && e.target === e.currentTarget && onRowClick(row.original))
              }
              className={cn(onRowClick && 'cursor-pointer', rowClassName?.(row.original))}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={cn(BODY_CELL, alignRight(cell.column.columnDef.meta))}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>

        {totals && (
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              {table.getVisibleLeafColumns().map((column, _, visible) => {
                // The row count goes in the first column that has no total of its own.
                const countHere = visible.find((c) => totals[c.id] === undefined)?.id === column.id
                return (
                  <TableCell key={column.id} className={cn(FOOT_CELL, alignRight(column.columnDef.meta))}>
                    {countHere ? `${data.length} ${noun}${data.length === 1 ? '' : 's'}` : totals[column.id]}
                  </TableCell>
                )
              })}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  )

  return (
    <div className={TABLE_CARD}>
      {toolbar && <div className="border-b">{toolbar}</div>}
      {data.length === 0 && empty ? <div className="p-4 sm:p-6">{empty}</div> : grid}
    </div>
  )
}
