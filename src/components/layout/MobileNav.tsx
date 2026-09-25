import { Bell, List, X } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import logoWordmark from '@/assets/brand/logo-wordmark.svg'
import { paths } from '@/app/paths'
import { IconButton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { NotificationBadge } from './NotificationBadge'
import { Sidebar } from './Sidebar'

/** Top bar for phones: menu toggle, logo and notifications. */
export function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-hairline bg-sidebar px-2 md:hidden">
      <div className="flex items-center gap-1">
        <IconButton label="Open menu" onClick={onMenu} className="size-10 text-fg">
          <List className="size-7" />
        </IconButton>
        <NavLink to={paths.home} aria-label="CommUniti home">
          <img src={logoWordmark} alt="CommUniti" width={142} height={30} className="h-[30px] w-auto" />
        </NavLink>
      </div>
      <NavLink to={paths.notifications} aria-label="Notifications" className="relative mr-2 p-1 text-fg-muted">
        <Bell className="size-6" />
        <NotificationBadge className="absolute -top-0.5 -right-1 size-4 text-[10px]" />
      </NavLink>
    </header>
  )
}

/** Off-canvas sidebar for phones and tablets (below lg). */
export function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div className={cn('fixed inset-0 z-40 lg:hidden', !open && 'pointer-events-none')} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn('absolute inset-0 bg-black/50 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={cn(
          'absolute inset-y-0 left-0 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar className="max-w-[85vw]" />
        <IconButton label="Close menu" onClick={onClose} className="absolute top-4 right-3 size-9 bg-fg/5 text-fg">
          <X className="size-5" />
        </IconButton>
      </div>
    </div>
  )
}
