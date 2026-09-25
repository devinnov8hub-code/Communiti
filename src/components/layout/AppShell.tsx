import { useCallback, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { MobileTopBar, NavDrawer } from './MobileNav'
import { Sidebar } from './Sidebar'

/**
 * Signed-in layout.
 * - lg+: full sidebar (296px), content column (708px) and optional right rail (xl+).
 * - md–lg: collapsed icon rail; its toggle opens the full sidebar as a drawer.
 * - <md: top bar with a menu toggle that opens the drawer.
 */
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])

  // Close the drawer whenever the route changes.
  const { pathname } = useLocation()
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setNavOpen(false)
  }

  return (
    <div className="min-h-dvh bg-background">
      <MobileTopBar onMenu={() => setNavOpen(true)} />
      <div className="flex">
        <Sidebar className="sticky top-0 hidden lg:flex" />
        <Sidebar collapsed onToggle={() => setNavOpen(true)} className="sticky top-0 hidden md:flex lg:hidden" />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
      <NavDrawer open={navOpen} onClose={closeNav} />
    </div>
  )
}

interface PageColumnsProps {
  children: ReactNode
  aside?: ReactNode
  className?: string
  /** Override the rail's padding (e.g. the chat panel is edge-to-edge). */
  asideClassName?: string
}

/**
 * Main column + right rail. The main (feed) column takes the remaining width;
 * the rail stays fixed (508px in Figma, 400px on smaller desktops).
 */
export function PageColumns({ children, aside, className, asideClassName }: PageColumnsProps) {
  return (
    <div className="flex">
      <main className={cn('min-w-0 flex-1', className)}>{children}</main>
      {aside && (
        <aside
          className={cn(
            'sticky top-0 hidden h-dvh w-[400px] shrink-0 overflow-y-auto border-l border-hairline px-6 pt-7 pb-10 min-[1440px]:w-[508px] min-[1440px]:px-10 xl:block',
            asideClassName,
          )}
        >
          {aside}
        </aside>
      )}
    </div>
  )
}
