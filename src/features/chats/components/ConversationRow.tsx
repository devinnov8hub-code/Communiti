import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar } from '@/components/ui'
import type { Conversation } from '@/lib/api'
import { cn } from '@/lib/cn'
import { shortAgo } from '../format'

/** One row in the chats list (Figma "message"). */
export function ConversationRow({ conversation, active }: { conversation: Conversation; active: boolean }) {
  return (
    <li className="border-b border-hairline py-2">
      <Link
        to={paths.chat(conversation.id)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center justify-between gap-3 rounded-control px-1.5 py-[3px] transition-colors hover:bg-fg/[0.03]',
          active && 'bg-brand-orange-tint/60 dark:bg-grey-50',
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1">
          <Avatar src={conversation.avatarUrl ?? undefined} name={conversation.title} size={45} />
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="truncate text-body-m text-fg sm:text-body-l">{conversation.title}</span>
            <span className="line-clamp-2 text-body-s text-fg-muted sm:text-body-m">
              {conversation.lastMessagePreview || 'No messages yet'}
            </span>
          </span>
        </span>
        <span className="flex w-[45px] shrink-0 flex-col items-center justify-center gap-[11px]">
          {conversation.lastMessageAt && (
            <time dateTime={conversation.lastMessageAt} className="text-center text-caption text-fg">
              {shortAgo(conversation.lastMessageAt)}
            </time>
          )}
          {conversation.unreadCount > 0 && (
            <span
              aria-label={`${conversation.unreadCount} unread`}
              className="flex size-6 items-center justify-center rounded-full bg-brand-orange text-caption text-white"
            >
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}
