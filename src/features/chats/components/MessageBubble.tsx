import { DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react'
import { IconButton, Menu, MenuItem } from '@/components/ui'
import type { Media, Message } from '@/lib/api'
import { cn } from '@/lib/cn'
import { EDIT_WINDOW_MS, formatDuration, messageTime } from '../format'

interface MessageBubbleProps {
  message: Message
  /** Current time (ticks each minute) for the 15-minute edit window. */
  now: number
  onEdit: (message: Message) => void
  onDelete: (message: Message) => void
}

/** One message in a chat (Figma "projects chat" bubbles). My messages get Edit / Delete. */
export function MessageBubble({ message, now, onEdit, onDelete }: MessageBubbleProps) {
  if (message.kind === 'system') {
    return (
      <li className="mx-auto max-w-[297px] rounded-full bg-surface px-3 py-1 text-center text-caption text-fg-muted">
        {message.body}
      </li>
    )
  }

  const mine = message.isMine
  const editable =
    mine && !message.isDeleted && !!message.body && now - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS
  const deletable = mine && !message.isDeleted

  return (
    <li className={cn('group flex items-start gap-1', mine ? 'justify-end' : 'justify-start')}>
      {deletable && (
        <Menu
          className="w-[200px] rounded-search"
          trigger={
            <IconButton
              label="Message options"
              className="mt-1 size-7 text-fg-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <DotsThreeVertical weight="bold" className="size-5" />
            </IconButton>
          }
        >
          {(close) => (
            <>
              {editable && (
                <MenuItem
                  size="sm"
                  tone="muted"
                  icon={<PencilSimple />}
                  onSelect={() => {
                    close()
                    onEdit(message)
                  }}
                >
                  Edit message
                </MenuItem>
              )}
              <MenuItem
                size="sm"
                tone="danger"
                icon={<Trash />}
                onSelect={() => {
                  close()
                  onDelete(message)
                }}
              >
                Delete for everyone
              </MenuItem>
            </>
          )}
        </Menu>
      )}
      <div
        className={cn(
          'flex w-fit max-w-[297px] flex-col gap-[3px] rounded-t-card px-2 py-[5px]',
          mine
            ? 'w-full rounded-bl-card bg-brand-orange text-white'
            : 'rounded-br-card border border-hairline bg-popover text-fg',
        )}
      >
        <p className={cn('text-caption', mine ? 'text-brand-green' : 'text-brand-orange')}>
          {mine ? 'You' : (message.sender?.fullName ?? 'Someone')} ~~
        </p>
        {message.replyTo && (
          <p
            className={cn(
              'line-clamp-2 border-l-2 pl-2 text-caption',
              mine ? 'border-white/60 text-white/80' : 'border-brand-orange text-fg-muted',
            )}
          >
            {message.replyTo.senderName && <span className="font-semibold">{message.replyTo.senderName}: </span>}
            {message.replyTo.body}
          </p>
        )}
        {message.isDeleted ? (
          <p className="text-body-s italic opacity-80">This message was deleted</p>
        ) : (
          <>
            {message.body && <p className="text-body-s break-words whitespace-pre-line">{message.body}</p>}
            {message.media.map((file) => (
              <MediaItem key={file.id} file={file} mine={mine} />
            ))}
          </>
        )}
        <time dateTime={message.createdAt} className={cn('text-caption', mine ? 'text-grey-30' : 'text-grey-40')}>
          {messageTime(message.createdAt)}
          {message.editedAt && !message.isDeleted && ' · edited'}
        </time>
      </div>
    </li>
  )
}

function MediaItem({ file, mine }: { file: Media; mine: boolean }) {
  if (!file.url) return null
  if (file.kind === 'image') {
    return <img src={file.url} alt={file.originalName ?? ''} className="mt-1 max-h-48 rounded-control object-cover" />
  }
  if (file.kind === 'audio') {
    return (
      <span className="flex flex-col gap-0.5">
        <audio
          controls
          preload="metadata"
          src={file.url}
          aria-label="Voice note"
          className="h-10 w-[260px] max-w-full"
        />
        {file.durationSeconds != null && (
          <span className={cn('text-caption', mine ? 'text-white/80' : 'text-fg-muted')}>
            Voice note · {formatDuration(file.durationSeconds)}
          </span>
        )}
      </span>
    )
  }
  if (file.kind === 'video') {
    return <video controls preload="metadata" src={file.url} className="mt-1 max-h-60 rounded-control" />
  }
  return (
    <a href={file.url} target="_blank" rel="noreferrer" className="text-body-s break-all underline">
      {file.originalName ?? 'Attachment'}
    </a>
  )
}
