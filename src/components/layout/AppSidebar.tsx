import { NavLink, useLocation } from 'react-router'
import { NAV_ITEMS, navItemFor } from '@/app/navigation'
import { Logo } from '@/components/brand/Logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { UserMenu } from './UserMenu'

export function AppSidebar() {
  const { pathname } = useLocation()
  const active = navItemFor(pathname)
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar variant="inset" collapsible="icon">
      {/* Expanded: logo + collapse trigger. Collapsed (icon rail): trigger only. */}
      <SidebarHeader className="h-14 flex-row items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:justify-center">
        <Logo className="min-w-0 text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden" />
        <SidebarTrigger className="size-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={active?.path === item.path}
                    tooltip={item.title}
                    className="h-10 font-semibold data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:hover:bg-sidebar-primary data-[active=true]:hover:text-sidebar-primary-foreground"
                  >
                    <NavLink to={item.path} end={item.path === '/'} onClick={() => isMobile && setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}
