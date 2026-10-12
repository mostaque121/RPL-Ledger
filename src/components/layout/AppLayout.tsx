import { useState } from 'react'
import { Outlet } from 'react-router'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { InvoiceModal } from '@/features/invoices/components/InvoiceModal'
import { KeyboardShortcuts } from '@/features/search/components/KeyboardShortcuts'
import { SaleModal } from '@/features/sales/components/modal/SaleModal'
import { useConnectionToasts } from '@/hooks/use-connection-toasts'
import { AppSidebar } from './AppSidebar'
import { InsetContext } from './inset-context'
import { PageActionsContext } from './page-actions-context'
import { TopBar } from './TopBar'

/**
 * Signed-in shell. Inset variant: the dark sidebar colour frames the page, and the content
 * is a rounded card that scrolls on its own (desktop), so the frame and top bar stay put.
 * The card itself doesn't scroll (an inner wrapper does), so full-page modals portalled into
 * it (`FormModal`) always cover exactly the visible card.
 */
export function AppLayout() {
  const [actionsEl, setActionsEl] = useState<HTMLElement | null>(null)
  const [insetEl, setInsetEl] = useState<HTMLElement | null>(null)
  useConnectionToasts()

  return (
    <SidebarProvider>
      <KeyboardShortcuts>
        <AppSidebar />
        <SidebarInset ref={setInsetEl} className="md:h-[calc(100svh-1rem)] md:overflow-hidden md:dark:ring-1 md:dark:ring-border">
          <InsetContext.Provider value={insetEl}>
            <PageActionsContext.Provider value={actionsEl}>
              <div data-slot="app-scroll" className="flex min-h-0 flex-1 flex-col md:overflow-y-auto">
                <TopBar actionsRef={setActionsEl} />
                <main className="mx-auto w-full max-w-[100rem] flex-1 space-y-6 p-4 sm:p-6">
                  <Outlet />
                </main>
              </div>
              {/* Full-page forms that open from any page through the URL. */}
              <InvoiceModal />
              <SaleModal />
            </PageActionsContext.Provider>
          </InsetContext.Provider>
        </SidebarInset>
      </KeyboardShortcuts>
    </SidebarProvider>
  )
}
