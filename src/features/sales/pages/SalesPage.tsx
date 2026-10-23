import { useMemo } from 'react'
import { PlusIcon, ReceiptTextIcon, SearchXIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import type { CustomizerSection } from '@/components/data/ViewCustomizer'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryView } from '@/components/feedback/QueryView'
import { PageActions } from '@/components/layout/PageActions'
import type { BackState } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { usePeopleQuery } from '@/features/employees/api'
import { useCoursesQuery } from '@/features/settings/api/courses'
import { useRtosQuery } from '@/features/settings/api/rtos'
import { useViewItems } from '@/hooks/use-view-items'
import { formatMonth } from '@/lib/format'
import { defaultItems, visibleIds, type ViewItem } from '@/lib/view-prefs'
import { useSalesQuery } from '../api/sales'
import { SalesFilterBar } from '../components/SalesFilterBar'
import { SalesTabs } from '../components/SalesTabs'
import { SalesTable, SalesTableSkeleton } from '../components/SalesTable'
import { filterSales, type OwnerFilter, type SalesFilters } from '../filters'
import { useSaleModal } from '../hooks/use-sale-modal'
import { useSalesParams } from '../hooks/use-sales-params'
import { saleHref } from '../links'
import { effectiveFilters, FILTER_FIELD, SALE_COLUMNS, SALE_FILTERS, type SaleFilterId } from '../view'

/**
 * On desktop the page is exactly the visible card's height (the inset's 100svh − 1rem, minus the
 * 3.5rem top bar and the 3rem of `main` padding), so the table card fills the rest and only its rows
 * scroll. Phones keep the normal page scroll.
 */
const FILL_PAGE = 'flex flex-col gap-4 md:h-[calc(100svh-7.5rem)]'

export function SalesPage() {
  const sales = useSalesQuery()
  const people = usePeopleQuery()
  const rtos = useRtosQuery()
  const courses = useCoursesQuery()
  const { filters, setFilters } = useSalesParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const saleModal = useSaleModal()
  // The back arrow on the sale page comes back to this list with the same filters.
  const openSale = (id: string) => void navigate(saleHref(id), { state: { from: `/sales${search}` } satisfies BackState })

  // The viewer's columns and filters (shown, hidden, order), remembered in this browser.
  const [columns, setColumns, resetColumns] = useViewItems('sales:columns', SALE_COLUMNS)
  const [filterItems, setFilterItems, resetFilterItems] = useViewItems('sales:filters', SALE_FILTERS)
  const shownFilters = visibleIds(filterItems)

  /** Hiding a filter also clears it, so nothing narrows the list unseen. */
  function changeFilterItems(next: ViewItem<SaleFilterId>[]) {
    const cleared: Partial<SalesFilters> = {}
    for (const item of next) if (!item.visible) cleared[FILTER_FIELD[item.id]] = 'all'
    setFilters(cleared)
    setFilterItems(next)
  }

  const sellerOptions = useMemo(() => (people.data ?? []).map((p) => ({ value: p.id, label: p.name })), [people.data])
  const rtoOptions = useMemo(() => (rtos.data ?? []).map((r) => ({ value: r.id, label: r.name })), [rtos.data])
  const courseOptions = useMemo(() => (courses.data ?? []).map((c) => ({ value: c.id, label: c.name })), [courses.data])
  const all = sales.data
  // A few hundred rows at most, so filtering on every render is fine.
  const active = effectiveFilters(filters, shownFilters)
  const shown = all ? filterSales(all, active) : []
  const countFor = (owner: OwnerFilter, f: SalesFilters = active) => (all ? filterSales(all, { ...f, owner }).length : 0)
  // Until it's opened, the RTO tab counts every month, as opening it switches to all months.
  const rtoDueCount = countFor('rtoDue', filters.owner === 'rtoDue' ? active : { ...active, month: 'all' })
  const counts = all ? { all: countFor('all'), mine: countFor('mine'), others: countFor('others'), rtoDue: rtoDueCount } : null
  /** An old sale can still owe its RTO, so the RTO tab opens on all months. */
  const changeTab = (owner: OwnerFilter) => setFilters(owner === 'rtoDue' ? { owner, month: 'all' } : { owner })

  const customize: CustomizerSection[] = [
    { key: 'columns', label: 'Columns', defs: SALE_COLUMNS, items: columns, onChange: setColumns, onReset: resetColumns },
    {
      key: 'filters',
      label: 'Filters',
      defs: SALE_FILTERS,
      items: filterItems,
      onChange: changeFilterItems,
      onReset: () => {
        // Clears any filter that the defaults hide, then forgets the saved choice.
        changeFilterItems(defaultItems(SALE_FILTERS))
        resetFilterItems()
      },
    },
  ]

  const toolbar = (
    <SalesFilterBar
      filters={filters}
      onChange={setFilters}
      visible={shownFilters}
      sellers={sellerOptions}
      rtos={rtoOptions}
      courses={courseOptions}
      customize={customize}
    />
  )

  const addButton = (
    <Button onClick={saleModal.openNew}>
      <PlusIcon />
      Add sale
    </Button>
  )

  return (
    <>
      <PageActions>
        <Button onClick={saleModal.openNew}>
          <PlusIcon />
          <span className="hidden sm:inline">Add sale</span>
        </Button>
      </PageActions>

      <QueryView
        query={sales}
        loading={
          // Tabs and filters work straight away; only the rows wait for the data.
          <div className={FILL_PAGE}>
            <SalesTabs value={filters.owner} onChange={changeTab} counts={null} />
            {toolbar}
            <SalesTableSkeleton view={columns} />
          </div>
        }
      >
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              icon={ReceiptTextIcon}
              title="No sales yet"
              description="Add your first sale. Payments, RTO payments and completion are tracked from the sale."
              action={addButton}
            />
          ) : (
            <div className={FILL_PAGE}>
              <SalesTabs value={filters.owner} onChange={changeTab} counts={counts} />
              {toolbar}
              <SalesTable
                sales={shown}
                view={columns}
                onOpen={(s) => openSale(s.id)}
                empty={
                  <EmptyState
                    icon={SearchXIcon}
                    className="border-0 py-12"
                    title={filters.month === 'all' ? 'No matching sales' : `No matching sales in ${formatMonth(filters.month)}`}
                    description="Try another month, or clear the filters."
                    action={
                      filters.month !== 'all' && (
                        <Button variant="outline" onClick={() => setFilters({ month: 'all' })}>
                          Search all months
                        </Button>
                      )
                    }
                  />
                }
              />
            </div>
          )
        }
      </QueryView>
    </>
  )
}
