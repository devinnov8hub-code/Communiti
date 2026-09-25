import { List, SignOut } from '@phosphor-icons/react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import logoMark from '@/assets/brand/logo-mark.svg'
import logoWordmark from '@/assets/brand/logo-wordmark.svg'
import { paths } from '@/app/paths'
import { Avatar, IconButton } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getDisplayName, getRoleLabel } from '@/features/auth/user'
import { SignOutDialog } from '@/features/settings/components/SignOutDialog'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from './navigation'
import { NotificationBadge } from './NotificationBadge'

interface SidebarProps {
  /** Icon-only rail (tablet). The toggle expands the full drawer. */
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

/** Main navigation (Figma "Sidebar", 296px) — full, or collapsed to an icon rail. */
export function Sidebar({ collapsed = false, onToggle, className }: SidebarProps) {
  const { user } = useAuth()
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  return (
    <aside
      className={cn(
        'flex h-dvh shrink-0 flex-col justify-between border-r border-hairline bg-sidebar py-5',
        collapsed ? 'w-[76px] items-center px-2' : 'w-[296px] px-2.5',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-[34px]', collapsed ? 'items-center' : 'pl-[18px]')}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-5">
            <IconButton label="Open menu" onClick={onToggle} className="size-10 text-fg">
              <List className="size-7" />
            </IconButton>
            <NavLink to={paths.home} aria-label="CommUniti home">
              <img src={logoMark} alt="" width={27} height={32} className="h-8 w-auto" />
            </NavLink>
          </div>
        ) : (
          <NavLink to={paths.home} aria-label="CommUniti home" className="w-fit">
            <img src={logoWordmark} alt="CommUniti" width={180} height={38} className="h-[38px] w-[180px]" />
          </NavLink>
        )}

        <nav aria-label="Main">
          <ul className="flex flex-col gap-gap-sm">
            {NAV_ITEMS.map(({ label, to, icon: Icon, badgeKey }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === paths.home}
                  title={collapsed ? label : undefined}
                  aria-label={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-[13px] py-[5px] text-body-l transition-colors',
                      collapsed && 'justify-center rounded-full p-2 hover:bg-fg/5',
                      isActive ? 'font-semibold text-brand-orange' : 'text-fg-muted hover:text-fg',
                    )
                  }
                >
                  <Icon aria-hidden className="size-7 shrink-0" />
                  {!collapsed && label}
                  {badgeKey && (
                    <NotificationBadge className={cn(collapsed && 'absolute top-0 right-0 size-4 text-[10px]')} />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {user && (
        <div
          className={cn(
            'flex border-t border-hairline py-2.5',
            collapsed ? 'flex-col items-center gap-3' : 'items-start justify-between',
          )}
        >
          <NavLink
            to={paths.profile}
            aria-label={collapsed ? 'Profile' : undefined}
            className="flex min-w-0 items-center gap-2"
          >
            <Avatar src={user.avatarUrl} name={getDisplayName(user)} size={46} />
            {!collapsed && (
              <span className="flex min-w-0 flex-col gap-[11px]">
                <span className="truncate text-body-s text-fg">{getDisplayName(user)}</span>
                <span className="text-caption text-brand-orange">{getRoleLabel(user)}</span>
              </span>
            )}
          </NavLink>
          <IconButton
            label="Log out"
            onClick={() => setConfirmSignOut(true)}
            className="p-1 text-fg-muted hover:text-fg"
          >
            <SignOut className="size-[22px]" />
          </IconButton>
        </div>
      )}
      {confirmSignOut && <SignOutDialog onClose={() => setConfirmSignOut(false)} />}
    </aside>
  )
}
