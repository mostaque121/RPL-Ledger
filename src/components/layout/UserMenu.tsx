import { ChevronsUpDownIcon, KeyboardIcon, LogOutIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/features/auth/auth-context'
import { useOpenShortcutsHelp } from '@/features/search/hooks/shortcuts-help'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const openShortcuts = useOpenShortcutsHelp()
  const email = user?.email ?? ''
  const initial = (email[0] ?? '?').toUpperCase()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sm font-bold text-sidebar-accent-foreground">
                {initial}
              </span>
              <span className="min-w-0 flex-1 text-left leading-tight">
                <span className="block truncate text-sm font-semibold text-sidebar-accent-foreground">Tanvir</span>
                <span className="block truncate text-xs opacity-70">{email}</span>
              </span>
              <ChevronsUpDownIcon className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={openShortcuts} className="max-md:hidden">
              <KeyboardIcon />
              Keyboard shortcuts
              <DropdownMenuShortcut>?</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
