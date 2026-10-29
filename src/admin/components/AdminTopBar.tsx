import { ArrowLeft, Bell, Check, MagnifyingGlass, Moon, Sun } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconButton, Menu, MenuRadioItem, Spinner } from '@/components/ui'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { ThemePreference } from '@/providers/themeContext'
import { useTheme } from '@/providers/useTheme'
import { useInbox, useMarkInboxRead } from '../hooks/queries'

interface AdminTopBarProps {
  title: string
  /** Page search; omit to hide the field (event view). */
  searchPlaceholder?: string
  search?: string
  onSearch?: (value: string) => void
  /** Shows a back arrow before the title (Figma "Challenge view"). */
  back?: string
  className?: string
}

/** Admin page header (Figma "Top Navigation"): title, search and the notifications bell. */
export function AdminTopBar({ title, searchPlaceholder, search, onSearch, back, className }: AdminTopBarProps) {
  const navigate = useNavigate()

  return (
    <header
      className={cn(
        'flex flex-wrap items-center gap-x-[30px] gap-y-3 border-b border-hairline px-4 pt-4 pb-2.5 sm:px-5 lg:pt-[27px]',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3 lg:w-[241px]">
        {back && (
          <IconButton
            label="Back"
            onClick={() => navigate(back)}
            className="size-[34px] shrink-0 bg-fg/5 text-fg hover:bg-fg/10"
          >
            <ArrowLeft className="size-5" />
          </IconButton>
        )}
        <h1 className={cn('truncate font-bold text-fg', back ? 'text-h3' : 'text-h3 sm:text-[28px]')}>{title}</h1>
      </div>
      <div className="order-last flex w-full items-center gap-4 sm:order-none sm:w-auto sm:flex-1 sm:justify-between">
        {searchPlaceholder ? (
          <label className="flex h-[54px] w-full max-w-[668px] cursor-text items-center gap-2 rounded-control border border-hairline bg-surface-raised px-2 focus-within:border-brand-green dark:border-border-default">
            <MagnifyingGlass aria-hidden className="size-3 shrink-0 text-fg" />
            <input
              type="search"
              value={search ?? ''}
              onChange={(event) => onSearch?.(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-body-m text-fg outline-none placeholder:text-fg-muted"
            />
          </label>
        ) : (
          <span className="flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-1">
          <ThemeSwitcher />
          <AdminInbox />
        </div>
      </div>
    </header>
  )
}

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Device settings' },
]

/** Light / dark / device theme — the same saved preference as the member app's Settings › App Theme. */
function ThemeSwitcher() {
  const { preference, resolvedTheme, setPreference } = useTheme()
  const Icon = resolvedTheme === 'dark' ? Moon : Sun
  return (
    <Menu
      title="Theme"
      className="w-[220px]"
      trigger={
        <IconButton
          label={`Theme: ${THEMES.find((theme) => theme.value === preference)?.label}`}
          className="size-10 text-fg"
        >
          <Icon className="size-6" />
        </IconButton>
      }
    >
      {(close) =>
        THEMES.map((theme) => (
          <MenuRadioItem
            key={theme.value}
            checked={preference === theme.value}
            onSelect={() => {
              setPreference(theme.value)
              close()
            }}
          >
            {theme.label}
          </MenuRadioItem>
        ))
      }
    </Menu>
  )
}

/** Bell with the admin notifications dropdown (Figma "Notifications" popover). */
function AdminInbox() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const inbox = useInbox()
  const markRead = useMarkInboxRead()
  const unread = inbox.data?.data.filter((item) => !item.read).length ?? 0

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => !root.current?.contains(event.target as Node) && setOpen(false)
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={root} className="relative shrink-0">
      <IconButton
        label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative size-10 text-fg"
      >
        <Bell className="size-6" />
        {unread > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-brand-orange" />}
      </IconButton>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-full right-0 z-30 mt-2 flex w-[min(594px,calc(100vw-32px))] flex-col gap-gap-sm overflow-hidden rounded-modal border border-hairline bg-popover py-3.5 shadow-popover"
        >
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 pb-2">
            <h2 className="text-h3 font-semibold text-fg">Notifications</h2>
            <button
              type="button"
              disabled={!unread || markRead.isPending}
              onClick={() => markRead.mutate()}
              className="flex items-center gap-2 text-body-m font-semibold text-brand-orange disabled:opacity-50"
            >
              <Check aria-hidden className="size-6" />
              Mark all as read
            </button>
          </div>
          <InboxList>
            {inbox.isPending ? (
              <li className="flex justify-center py-4 text-brand-orange">
                <Spinner />
              </li>
            ) : inbox.data?.data.length ? (
              inbox.data.data.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 border-b border-hairline pb-2 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn('text-body-l text-fg', !item.read && 'font-semibold')}>{item.title}</p>
                    <time dateTime={item.createdAt} className="shrink-0 text-body-s text-fg-muted">
                      {formatTime(item.createdAt)}
                    </time>
                  </div>
                  <p className="text-body-m text-grey-40 dark:text-fg-body">{item.body}</p>
                </li>
              ))
            ) : (
              <li className="py-4 text-center text-body-m text-fg-muted">You’re all caught up.</li>
            )}
          </InboxList>
        </div>
      )}
    </div>
  )
}

function InboxList({ children }: { children: ReactNode }) {
  return <ul className="flex max-h-[360px] flex-col gap-[23px] overflow-y-auto px-5">{children}</ul>
}
