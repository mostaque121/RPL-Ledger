/** Layout classes shared by the sale page and its loading skeleton, so the two line up exactly. */

/**
 * Desktop: the page itself never scrolls. It fills the space under the top bar down to the card's
 * bottom edge (100svh − 1rem inset margin − 3.5rem top bar − 1.5rem top padding; the bottom padding
 * is cancelled with -mb-6 and moved inside each column), and each column scrolls on its own.
 * The row is minmax(0,1fr) so a long tab can't stretch it: it has to scroll instead.
 */
export const SALE_GRID =
  'grid gap-4 lg:-mb-6 lg:h-[calc(100svh-6rem)] lg:grid-cols-[minmax(19rem,22rem)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-6'

/** The left column: who and what. */
export const SALE_ASIDE =
  'space-y-4 lg:-ml-1 lg:-mr-3 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pt-px lg:pl-1 lg:pr-3 lg:pb-6 lg:scrollbar-slim'

/** The right column's root: tab bar on top, the tab's body below. */
export const SALE_TABS_ROOT = 'flex min-w-0 flex-col lg:h-full lg:min-h-0'

/** On phones the page scrolls and the tab bar sticks under the top bar; on desktop it stays put. */
export const SALE_TAB_BAR =
  'sticky top-14 z-10 -mx-4 mb-4 shrink-0 bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:px-0'

/** Each tab's body. On desktop only this scrolls. */
export const SALE_TAB_CONTENT =
  'space-y-6 outline-none lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:-ml-1 lg:-mr-3 lg:pl-1 lg:pr-3 lg:pt-px lg:pb-6 lg:scrollbar-slim'

export type SaleTab = 'overview' | 'payments' | 'invoices' | 'notes' | 'tasks'

/** The tabs on the right, in order. */
export const SALE_TABS: { value: SaleTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'payments', label: 'Payments' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'notes', label: 'Notes' },
  { value: 'tasks', label: 'Tasks' },
]
