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
import {
  BODY_CELL,
  FILL_CARD,
  FILL_GRID,
  FOOT_CELL,
  HEAD_CELL,
  HEAD_ROW,
  STICKY_FOOT,
  STICKY_FOOT_ROW,
  STICKY_HEAD,
  TABLE_CARD,
} from './table-styles'

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
  /** The row's own page: Ctrl / ⌘ / Shift + click, Ctrl + Enter or a middle click opens it in a new tab. */
  rowHref?: (row: T) => string
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
  /** Fill the parent's height: only the rows scroll, the header and totals stay in view (see `FILL_CARD`). */
  fill?: boolean
}

const alignRight = (meta: { align?: 'right' } | undefined) => meta?.align === 'right' && 'text-right'

/** Sortable table in the app's card style, with an optional totals footer. */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  rowHref,
  rowClassName,
  totals,
  noun = 'row',
  columnOrder,
  columnVisibility,
  toolbar,
  empty,
  fill = false,
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

  const openInNewTab = (row: T) => rowHref && window.open(rowHref(row), '_blank', 'noopener')

  const grid = (
    <div className={fill ? FILL_GRID : 'overflow-x-auto'}>
      <Table>
        <TableHeader className={cn(fill && STICKY_HEAD)}>
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
              onClick={
                onRowClick &&
                ((e) => (rowHref && (e.ctrlKey || e.metaKey || e.shiftKey) ? openInNewTab(row.original) : onRowClick(row.original)))
              }
              // Middle click: stop the browser's autoscroll, then open the row like a link would.
              onMouseDown={rowHref && ((e) => e.button === 1 && e.preventDefault())}
              onAuxClick={rowHref && ((e) => e.button === 1 && openInNewTab(row.original))}
              onKeyDown={
                onRowClick &&
                ((e) => {
                  if (e.key !== 'Enter' || e.target !== e.currentTarget) return
                  if (rowHref && (e.ctrlKey || e.metaKey)) openInNewTab(row.original)
                  else onRowClick(row.original)
                })
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
          <TableFooter className={cn(fill && STICKY_FOOT)}>
            <TableRow className={cn('hover:bg-transparent', fill && STICKY_FOOT_ROW)}>
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
    <div className={cn(TABLE_CARD, fill && FILL_CARD)}>
      {toolbar && <div className="shrink-0 border-b">{toolbar}</div>}
      {data.length === 0 && empty ? <div className="p-4 sm:p-6">{empty}</div> : grid}
    </div>
  )
}
