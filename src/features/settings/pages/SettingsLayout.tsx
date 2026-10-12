import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'
import { SETTINGS_NAV } from '../config'

/**
 * Settings shell: grouped sub-navigation + the selected page. On phones the menu scrolls
 * sideways above the page; on desktops it's a full-height panel (cancelling the main
 * padding) that stays put under the 3.5rem top bar and scrolls on its own. The scroll
 * area is the inset card, which is 1rem shorter than the viewport.
 */
export function SettingsLayout() {
  return (
    <div className="flex flex-col gap-6 lg:-my-6 lg:-ml-6 lg:flex-row lg:gap-0">
      <nav
        aria-label="Settings"
        className="lg:sticky lg:top-14 lg:h-[calc(100svh-4.5rem)] lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:bg-card lg:px-4 lg:py-6"
      >
        <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Settings</p>
        <div className="flex gap-6 overflow-x-auto pb-2 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
          {SETTINGS_NAV.map((section) => (
            <div key={section.group} className="shrink-0">
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">{section.group}</p>
              <ul className="flex gap-1 lg:flex-col">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-md px-2 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-accent hover:text-accent-foreground',
                          isActive && 'bg-accent font-medium text-accent-foreground',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      <div className="min-w-0 flex-1 lg:py-6 lg:pl-8">
        <div className="max-w-4xl">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
