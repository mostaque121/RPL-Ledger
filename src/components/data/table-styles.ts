/** Classes shared by `DataTable` and `DataTableSkeleton`, so the placeholder is the table's exact shape. */

/** The card around a list table. */
export const TABLE_CARD = 'overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10'

/** Header row: its own colour pair (see `--table-head` in index.css), a neutral grey band in light and dark mode. */
export const HEAD_ROW = 'border-b-0 bg-table-head hover:bg-table-head'

export const HEAD_CELL =
  'h-10 text-[11px] font-bold tracking-wider whitespace-nowrap text-table-head-foreground/75 uppercase first:pl-4'

export const BODY_CELL = 'first:pl-4'

export const FOOT_CELL = 'font-bold whitespace-nowrap first:pl-4'
