import { useUnreadMessages } from '@/features/chats/hooks/queries'
import { useUnreadCount } from '@/features/notifications/hooks/queries'
import { cn } from '@/lib/cn'

interface BadgeProps {
  className?: string
}

/** Unread count beside a nav item; hidden at zero. */
function CountBadge({ count, className }: BadgeProps & { count: number }) {
  if (!count) return null
  return (
    <span
      aria-label={`${count} unread`}
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-full bg-brand-orange p-[3px] text-caption text-white',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function NotificationBadge({ className }: BadgeProps) {
  return <CountBadge count={useUnreadCount()} className={className} />
}

export function ChatsBadge({ className }: BadgeProps) {
  const unread = useUnreadMessages()
  return <CountBadge count={unread.data ?? 0} className={className} />
}

/** The badge for a nav item's `badgeKey`. */
export function NavBadge({ kind, className }: BadgeProps & { kind: 'notifications' | 'chats' }) {
  return kind === 'chats' ? <ChatsBadge className={className} /> : <NotificationBadge className={className} />
}
