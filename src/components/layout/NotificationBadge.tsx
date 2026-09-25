import { useUnreadCount } from '@/features/notifications/hooks/queries'
import { cn } from '@/lib/cn'

export function NotificationBadge({ className }: { className?: string }) {
  const unread = useUnreadCount()
  if (!unread) return null
  return (
    <span
      aria-label={`${unread} unread`}
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-full bg-brand-orange p-[3px] text-caption text-white',
        className,
      )}
    >
      {unread > 9 ? '9+' : unread}
    </span>
  )
}
