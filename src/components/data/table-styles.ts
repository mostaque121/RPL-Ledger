/** Classes shared by `DataTable` and `DataTableSkeleton`, so the placeholder is the table's exact shape. */

/** The card around a list table. */
export const TABLE_CARD = 'overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10'

/** Header row: its own colour pair (see `--table-head` in index.css), a neutral grey band in light and dark mode. */
export const HEAD_ROW = 'border-b-0 bg-table-head hover:bg-table-head'

export const HEAD_CELL =
  'h-10 text-[11px] font-bold tracking-wider whitespace-nowrap text-table-head-foreground/75 uppercase first:pl-4'

export const BODY_CELL = 'first:pl-4'

export const FOOT_CELL = 'font-bold whitespace-nowrap first:pl-4'

/**
 * A list page that fills the screen on desktop: exactly the visible card's height (the inset's
 * 100svh − 1rem, minus the 3.5rem top bar and the 3rem of `main` padding), so a `fill` card takes
 * the rest and only its rows scroll. Phones keep the normal page scroll.
 */
export const FILL_PAGE = 'flex flex-col gap-4 md:h-[calc(100svh-7.5rem)]'

/**
 * `fill` tables: the card takes the height its parent leaves it and only the rows scroll,
 * under a header (and above a totals footer) that stay put. The shadcn `Table` wrapper's own
 * overflow is switched off, so this one box scrolls both ways and `sticky` works against it.
 */
export const FILL_CARD = 'flex min-h-0 flex-1 flex-col'
/** The scrolling box inside a `fill` card that isn't a table (e.g. the task groups). */
export const FILL_ROWS = 'min-h-0 flex-1 overflow-y-auto'
export const FILL_GRID = 'min-h-0 flex-1 overflow-auto [&>[data-slot=table-container]]:overflow-visible'
export const STICKY_HEAD = 'sticky top-0 z-10'
/** Opaque, so rows don't show through; a shadow stands in for the border, which wouldn't stick. */
export const STICKY_FOOT = 'sticky bottom-0 z-10 border-t-0 bg-card shadow-[0_-1px_0_var(--color-border)]'
export const STICKY_FOOT_ROW = 'bg-muted/50 hover:bg-muted/50'
