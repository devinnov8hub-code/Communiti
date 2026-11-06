import {
  Bell,
  CalendarDots,
  File,
  GearSix,
  GlobeHemisphereWest,
  House,
  List,
  ProjectorScreenChart,
  SignOut,
  Sparkle,
  User,
} from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logoWordmark from '@/assets/brand/logo-wordmark.svg'
import { adminPaths } from '../paths'
import { NavDrawer } from '@/components/layout/MobileNav'
import { Avatar, ConfirmDialog, IconButton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useAdminSession } from '../session/adminSessionContext'

const NAV = [
  { label: 'Overview', to: adminPaths.overview, icon: House, match: [adminPaths.moderation('overview')] },
  { label: 'Users', to: adminPaths.users, icon: User, match: [adminPaths.moderation('users')] },
  { label: 'Forums', to: adminPaths.forums, icon: GlobeHemisphereWest, match: [adminPaths.moderation('forums')] },
  {
    label: 'Projects',
    to: adminPaths.projects,
    icon: ProjectorScreenChart,
    match: [adminPaths.moderation('projects')],
  },
  { label: 'Events', to: adminPaths.events, icon: CalendarDots, match: [] },
  { label: 'Community Highlights', to: adminPaths.highlights, icon: Sparkle, match: [] },
  { label: 'Notifications', to: adminPaths.notifications, icon: Bell, match: [] },
  { label: 'Logs', to: adminPaths.logs, icon: File, match: [] },
  { label: 'Settings', to: adminPaths.settings, icon: GearSix, match: [] },
] as const

/**
 * Admin layout
 * menu toggle below lg. Pages render their own <AdminTopBar>.
 */
export function AdminShell() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])

  const { pathname } = useLocation()
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setNavOpen(false)
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b border-hairline bg-sidebar px-2 lg:hidden">
        <IconButton label="Open menu" onClick={() => setNavOpen(true)} className="size-10 text-fg">
          <List className="size-7" />
        </IconButton>
        <img src={logoWordmark} alt="CommUniti" width={142} height={30} className="h-[26px] w-auto" />
        <AdminBadge className="ml-2" />
      </header>
      <div className="flex">
        <AdminSidebar className="sticky top-0 hidden lg:flex" />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
      <NavDrawer open={navOpen} onClose={closeNav}>
        <AdminSidebar className="max-w-[85vw]" />
      </NavDrawer>
    </div>
  )
}

function AdminBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'rounded-full bg-brand-orange-tint px-2.5 py-2 text-caption text-brand-orange dark:bg-brand-orange/15',
        className,
      )}
    >
      ADMIN
    </span>
  )
}

function AdminSidebar({ className }: { className?: string }) {
  const { admin, signOut } = useAdminSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const name = admin ? `${admin.firstName} ${admin.lastName}`.trim() : 'Admin'

  return (
    <aside
      className={cn(
        'flex h-dvh w-[298px] shrink-0 flex-col justify-between border-r border-hairline bg-sidebar px-3 pt-[35px] pb-2.5',
        className,
      )}
    >
      <div className="flex flex-col gap-gap-2xl pl-3.5">
        <div className="flex items-center justify-between py-3">
          <NavLink to={adminPaths.overview} aria-label="Admin overview">
            <img src={logoWordmark} alt="CommUniti" width={149} height={31} className="h-[31px] w-[149px]" />
          </NavLink>
          <AdminBadge className="w-[75px] text-center" />
        </div>
        <nav aria-label="Admin">
          <ul className="flex flex-col gap-[19px]">
            {NAV.map(({ label, to, icon: Icon, match }) => {
              const sectionActive = match.some((path) => pathname.startsWith(path))
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === adminPaths.overview}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-[13px] py-[5px] text-body-l transition-colors',
                        isActive || sectionActive ? 'text-brand-orange' : 'text-fg-muted hover:text-fg',
                      )
                    }
                  >
                    <Icon aria-hidden className="size-7 shrink-0" />
                    {label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="flex items-center justify-between border-t border-hairline py-2.5">
        <NavLink
          to={adminPaths.profile}
          className={({ isActive }) =>
            cn('flex min-w-0 items-center gap-2 rounded-full pr-2', isActive && 'text-brand-orange')
          }
        >
          <Avatar src={admin?.avatarUrl} name={name} size={46} />
          <span className="truncate text-body-s">{name}</span>
        </NavLink>
        <IconButton label="Log out" onClick={() => setConfirmSignOut(true)} className="p-1 text-fg-muted hover:text-fg">
          <SignOut className="size-[22px]" />
        </IconButton>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Log out?"
        message="You’ll need your admin email and password to sign back in."
        confirmLabel="Log out"
        onClose={() => setConfirmSignOut(false)}
        onConfirm={async () => {
          await signOut()
          navigate(adminPaths.login, { replace: true })
        }}
      />
    </aside>
  )
}
