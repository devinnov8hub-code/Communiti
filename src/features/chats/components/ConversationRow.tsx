import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Conversation } from '../types'

/** Short relative time: "20 hrs", "5 mins", "3 days". */
function shortAgo(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'}`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'}`
}

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
          <Avatar src={conversation.avatarUrl} name={conversation.title} size={45} />
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="truncate text-body-m text-fg sm:text-body-l">{conversation.title}</span>
            <span className="line-clamp-2 text-body-s text-fg-muted sm:text-body-m">
              {conversation.preview || 'No messages yet'}
            </span>
          </span>
        </span>
        <span className="flex w-[45px] shrink-0 flex-col items-center justify-center gap-[11px]">
          <time dateTime={conversation.updatedAt} className="text-center text-caption text-fg">
            {shortAgo(conversation.updatedAt)}
          </time>
          {conversation.unread > 0 && (
            <span
              aria-label={`${conversation.unread} unread`}
              className="flex size-6 items-center justify-center rounded-full bg-brand-orange text-caption text-white"
            >
              {conversation.unread}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}
