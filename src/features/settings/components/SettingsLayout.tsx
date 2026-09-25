import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/app/paths'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import { cn } from '@/lib/cn'
import { SETTINGS_SECTIONS } from '../sections'

/**
 * Settings shell (Figma "Settings"): section nav (327px) + content, no right rail.
 * On small screens /settings shows the section list, each section opens full-width.
 */
export function SettingsLayout() {
  const { pathname } = useLocation()
  const atRoot = pathname === paths.settings

  return (
    <main className="flex min-h-[calc(100dvh-56px)] flex-col md:min-h-dvh">
      <SearchHeader searchClassName="max-w-[668px]" />
      <div className="flex flex-1">
        <nav
          aria-label="Settings"
          className={cn(
            'w-full shrink-0 border-r border-hairline px-5 pt-[30px] pb-2.5 lg:block lg:w-[327px]',
            atRoot ? 'block' : 'hidden',
          )}
        >
          <ul className="flex flex-col gap-gap-sm">
            {SETTINGS_SECTIONS.map(({ slug, label, icon: Icon }) => (
              <li key={slug}>
                <NavLink
                  to={paths.settingsSection(slug)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-[13px] rounded-control px-2 py-2.5 text-body-l transition-colors',
                      isActive ? 'bg-brand-orange-tint font-semibold text-brand-orange' : 'text-fg-muted hover:text-fg',
                    )
                  }
                >
                  <Icon aria-hidden weight={slug === 'help' ? 'fill' : 'regular'} className="size-7 shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={cn('min-w-0 flex-1', atRoot && 'hidden lg:block')}>
          <Outlet />
        </div>
      </div>
    </main>
  )
}
