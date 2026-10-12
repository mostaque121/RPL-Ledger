import { ArrowLeftIcon, SettingsIcon } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'
import { navItemFor } from '@/app/navigation'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { APP_NAME, useDocumentTitle } from '@/hooks/use-document-title'
import { SearchButton } from '@/features/search/components/SearchButton'
import { TasksShortcut } from '@/features/tasks/components/TasksShortcut'
import { ThemeToggle } from './ThemeToggle'

interface TopBarProps {
  /** Receives the element pages portal their action buttons into. */
  actionsRef: (el: HTMLDivElement | null) => void
}

/** Set by a list when it opens one of its rows, so the back arrow returns to the same filters. */
export interface BackState {
  from?: string
}

export function TopBar({ actionsRef }: TopBarProps) {
  const { pathname, state, key } = useLocation()
  const navigate = useNavigate()
  const item = navItemFor(pathname)
  const title = item?.title ?? APP_NAME
  const isSubPage = !!item && pathname !== item.path
  useDocumentTitle(item?.title)

  // A list's own filters first; otherwise wherever we came from in the app; otherwise the list.
  function goBack() {
    const from = (state as BackState | null)?.from
    if (from) void navigate(from)
    else if (key !== 'default') void navigate(-1)
    else void navigate(item?.backTo ?? item?.path ?? '/')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 print:hidden shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur sm:px-6 md:rounded-t-xl">
      {/* Phones/tablets only. On desktop the trigger lives in the sidebar header. */}
      <SidebarTrigger className="-ml-1.5 md:hidden" />
      {isSubPage && (
        <Button variant="ghost" size="icon-sm" className="-ml-1.5" aria-label="Back" title="Back" onClick={goBack}>
          <ArrowLeftIcon />
        </Button>
      )}
      <h1 className="truncate text-lg font-extrabold tracking-tight">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <div ref={actionsRef} className="flex items-center gap-2" />
        {/* App-wide shortcuts, after the page's own buttons. */}
        <div className="flex items-center gap-0.5">
          <SearchButton />
          <TasksShortcut />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="max-sm:hidden" asChild>
                <Link to="/settings" aria-label="Settings">
                  <SettingsIcon />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
