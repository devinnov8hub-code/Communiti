import { Bell, ChatsCircle, GearSix, Handshake, Ranking, UsersThree } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageColumns } from '@/components/layout/AppShell'
import { Avatar, EmptyState, IconButton, LoadMore, Tabs } from '@/components/ui'
import { RightRail } from '@/features/feed/components/RightRail'
import { cn } from '@/lib/cn'
import { NotificationSettingsModal } from '../components/NotificationSettingsModal'
import { useMarkNotificationRead, useNotifications } from '../hooks/queries'
import type { AppNotification, NotificationCategory, NotificationsTab } from '../types'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'messages', label: 'Messages' },
  { value: 'collaborations', label: 'Collaborations' },
  { value: 'posts', label: 'Posts' },
] as const

const CATEGORY_ICON: Record<NotificationCategory, typeof Ranking> = {
  posts: Ranking,
  messages: ChatsCircle,
  collaborations: Handshake,
  forums: UsersThree,
  general: Bell,
}

/** "23 m", "2 h", "3 d" */
function shortAgo(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} m`
  const hours = Math.round(minutes / 60)
  return hours < 24 ? `${hours} h` : `${Math.round(hours / 24)} d`
}

/** Notifications (Figma "Notifications"). */
export function NotificationsPage() {
  const [tab, setTab] = useState<NotificationsTab>('all')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const notifications = useNotifications()
  const visible = notifications.data?.filter((item) => tab === 'all' || item.category === tab) ?? []

  return (
    <PageColumns aside={<RightRail />}>
      <header className="sticky top-14 z-10 flex flex-col gap-4 border-b border-hairline bg-background px-4 pt-3.5 sm:px-5 md:top-0">
        <div className="flex items-center justify-between">
          <h1 className="text-h3 font-semibold text-fg">Notifications</h1>
          <IconButton
            label="Notification settings"
            onClick={() => setSettingsOpen(true)}
            className="size-10 bg-fg/5 p-2 hover:bg-fg/10"
          >
            <GearSix className="size-6 text-fg" />
          </IconButton>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Tabs label="Notifications" items={TABS} value={tab} onChange={setTab} className="min-w-[440px]" />
        </div>
      </header>

      {notifications.isPending ? (
        <div className="h-96 animate-pulse bg-surface" />
      ) : notifications.isError ? (
        <EmptyState title="Couldn’t load notifications" description="Check your connection and try again." />
      ) : visible.length ? (
        <ul className="flex flex-col gap-3.5">
          {visible.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </ul>
      ) : notifications.hasNextPage ? null : (
        <EmptyState title="You’re all caught up" description="New activity will show up here." />
      )}
      {notifications.hasNextPage && (
        // Re-keyed per page so it fires again if it is still in view after a page loads.
        <LoadMore
          key={notifications.data?.length}
          onVisible={() => !notifications.isFetchingNextPage && void notifications.fetchNextPage()}
        />
      )}

      {settingsOpen && <NotificationSettingsModal onClose={() => setSettingsOpen(false)} />}
    </PageColumns>
  )
}

function NotificationRow({ notification }: { notification: AppNotification }) {
  const navigate = useNavigate()
  const markRead = useMarkNotificationRead()
  const Icon = CATEGORY_ICON[notification.category]

  const open = () => {
    if (!notification.read) markRead.mutate(notification.id)
    if (notification.action) navigate(notification.action.href)
  }

  return (
    <li
      className={cn(
        'flex items-start justify-between gap-3 px-5 py-2.5',
        notification.read ? 'bg-background' : 'bg-brand-orange-tint/25 dark:bg-brand-orange/10',
      )}
    >
      <div className="flex min-w-0 items-start gap-[9px]">
        {notification.avatarUrl ? (
          <Avatar src={notification.avatarUrl} name={notification.title} size={38} />
        ) : (
          <span className="flex h-9 w-[47px] shrink-0 items-center justify-center bg-brand-orange-tint">
            <Icon aria-hidden weight="fill" className="size-6 text-brand-orange" />
          </span>
        )}
        <div className="flex max-w-[360px] min-w-0 flex-col items-start gap-[7px]">
          <p className="text-body-s text-fg">
            <span className="font-medium">{notification.title}</span>
            <span className="text-caption">: </span>
            {notification.body}
          </p>
          {notification.action && (
            <button
              type="button"
              onClick={open}
              className="rounded-full border-[0.3px] border-brand-orange p-2 text-caption text-brand-orange hover:bg-brand-orange-tint"
            >
              {notification.action.label}
            </button>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <time dateTime={notification.createdAt} className="text-caption text-fg-muted">
          {shortAgo(notification.createdAt)}
        </time>
        {!notification.read && <span aria-label="Unread" className="size-2 rounded-full bg-brand-orange" />}
      </div>
    </li>
  )
}
