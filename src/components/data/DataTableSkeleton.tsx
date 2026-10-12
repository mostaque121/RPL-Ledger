import type { ReactNode } from 'react'
import type { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { ArrowUpDownIcon } from 'lucide-react'
import { pickWidth } from '@/components/feedback/skeleton-widths'
import { LoadingRegion, SkeletonText } from '@/components/feedback/SkeletonText'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { BODY_CELL, FOOT_CELL, HEAD_CELL, HEAD_ROW, TABLE_CARD } from './table-styles'

/**
 * What a cell looks like while loading. Set on a column as `meta.skeleton`; without it a
 * right-aligned column gets an amount bar and any other column a text bar.
 * - `lines`: a bold first line and a small second line (client + course)
 * - `amountLines`: an amount with a small line under it (taka + A$ estimate)
 * - `badge` / `icons`: a status pill / a pair of icon buttons
 */
export type CellSkeleton = 'text' | 'lines' | 'amount' | 'amountLines' | 'badge' | 'icon' | 'icons' | 'none'

const TEXT_WIDTHS = ['w-20', 'w-28', 'w-16', 'w-24', 'w-14'] as const
const WIDE_WIDTHS = ['w-36', 'w-28', 'w-44', 'w-32', 'w-40'] as const
const SUB_WIDTHS = ['w-24', 'w-32', 'w-20', 'w-28'] as const
const AMOUNT_WIDTHS = ['w-16', 'w-14', 'w-20', 'w-12'] as const

function Cell({ kind, right, i }: { kind: CellSkeleton; right: boolean; i: number }) {
  const align = right ? 'right' : undefined
  switch (kind) {
    case 'none':
      return null
    case 'lines':
      return (
        <div className="min-w-40">
          <SkeletonText className={pickWidth(WIDE_WIDTHS, i)} />
          <SkeletonText size="xs" className={pickWidth(SUB_WIDTHS, i + 1)} />
        </div>
      )
    case 'amount':
      return <SkeletonText align={align ?? 'right'} className={pickWidth(AMOUNT_WIDTHS, i)} />
    case 'amountLines':
      return (
        <div>
          <SkeletonText align={align ?? 'right'} className={pickWidth(AMOUNT_WIDTHS, i)} />
          <SkeletonText size="11px" align={align ?? 'right'} className="w-12" />
        </div>
      )
    case 'badge':
      return <Skeleton aria-hidden className={cn('h-5 rounded-full', i % 3 === 1 ? 'w-20' : 'w-14')} />
    case 'icon':
    case 'icons':
      return (
        <div className="flex justify-end">
          {Array.from({ length: kind === 'icon' ? 1 : 2 }, (_, k) => (
            <span key={k} className="grid size-7 place-items-center">
              <Skeleton aria-hidden className="size-4 rounded" />
            </span>
          ))}
        </div>
      )
    case 'text':
      return <SkeletonText align={align} className={pickWidth(TEXT_WIDTHS, i)} />
  }
}

interface DataTableSkeletonProps<T> {
  /** The table's own column definitions: only `id`, `header` and `meta` are read. */
  columns: ColumnDef<T, unknown>[]
  columnOrder?: string[]
  columnVisibility?: VisibilityState
  rows?: number
  /** Column ids with a total in the footer. Leave out for a table without a footer. */
  totals?: readonly string[]
  /** Search / filters above the table, as on `DataTable`. */
  toolbar?: ReactNode
}

/** `DataTable`'s placeholder: the real card, the real column headers, and rows shaped like each column's cells. */
export function DataTableSkeleton<T>({ columns, columnOrder, columnVisibility, rows = 8, totals, toolbar }: DataTableSkeletonProps<T>) {
  const order = columnOrder ?? []
  const shown = columns
    .filter((c) => c.id && columnVisibility?.[c.id] !== false)
    .sort((a, b) => rank(order, a.id) - rank(order, b.id))
  const countCol = totals && shown.find((c) => !totals.includes(c.id ?? ''))?.id

  return (
    <LoadingRegion className={TABLE_CARD}>
      {toolbar && <div className="border-b">{toolbar}</div>}
      <Table>
        <TableHeader>
          <TableRow className={HEAD_ROW}>
            {shown.map((c) => {
              const label = typeof c.header === 'string' ? c.header : ''
              const right = c.meta?.align === 'right'
              const sortable = c.enableSorting !== false && label !== '' && 'accessorFn' in c
              return (
                <TableHead key={c.id} className={cn(HEAD_CELL, right && 'text-right')}>
                  <span className={cn('inline-flex items-center gap-1', right && 'flex-row-reverse')}>
                    {label}
                    {sortable && <ArrowUpDownIcon className="size-3 opacity-40" />}
                  </span>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, r) => (
            <TableRow key={r} className="hover:bg-transparent">
              {shown.map((c, col) => {
                const right = c.meta?.align === 'right'
                const kind = c.meta?.skeleton ?? (right ? 'amount' : 'text')
                return (
                  <TableCell key={c.id} className={cn(BODY_CELL, right && 'text-right')}>
                    <Cell kind={kind} right={right} i={r + col} />
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
        {totals && (
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              {shown.map((c) => {
                const right = c.meta?.align === 'right'
                const has = c.id === countCol || totals.includes(c.id ?? '')
                return (
                  <TableCell key={c.id} className={cn(FOOT_CELL, right && 'text-right')}>
                    {has && <SkeletonText align={right ? 'right' : undefined} className={c.id === countCol ? 'w-16' : 'w-18'} />}
                  </TableCell>
                )
              })}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </LoadingRegion>
  )
}

/** Position in the viewer's order; columns left out keep their place after these. */
function rank(order: string[], id: string | undefined): number {
  const i = order.indexOf(id ?? '')
  return i === -1 ? order.length : i
}
