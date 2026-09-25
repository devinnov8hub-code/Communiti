import {
  ArrowLeft,
  Broom,
  DotsThreeVertical,
  Image as ImageIcon,
  MagnifyingGlass,
  Microphone,
  PaperPlaneRight,
  Paperclip,
  Prohibit,
  Trash,
  User,
  X,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar, ConfirmDialog, IconButton, Menu, MenuItem, Spinner, useToast } from '@/components/ui'
import { AttachmentList } from '@/features/feed/components/CommentComposer'
import { getErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/cn'
import { useConversation, useConversationAction, useMarkRead, useMessages, useSendMessage } from '../hooks/queries'
import type { ChatMessage, Conversation } from '../types'

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

interface ChatPanelProps {
  conversationId: string
  /** Show a back button (full-page view on smaller screens). */
  onBack?: () => void
}

/** Conversation view — right bar of "projects chat" in Figma. */
export function ChatPanel({ conversationId, onBack }: ChatPanelProps) {
  const conversation = useConversation(conversationId)
  const messages = useMessages(conversationId)
  const markRead = useMarkRead()
  const [search, setSearch] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mark as read when opened.
  const { mutate: markAsRead } = markRead
  useEffect(() => {
    if (conversation.data?.unread) markAsRead(conversationId)
  }, [conversation.data?.unread, conversationId, markAsRead])

  // Keep the newest message in view.
  const count = messages.data?.length ?? 0
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [count, conversationId])

  const visible = useMemo(() => {
    const q = search?.trim().toLowerCase()
    return q ? messages.data?.filter((message) => message.text.toLowerCase().includes(q)) : messages.data
  }, [messages.data, search])

  if (conversation.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="text-brand-orange" />
      </div>
    )
  }
  if (conversation.isError) {
    return <p className="p-10 text-center text-body-m text-fg-muted">{getErrorMessage(conversation.error)}</p>
  }

  const chat = conversation.data

  return (
    <section aria-label={`Conversation with ${chat.title}`} className="flex h-full min-h-0 flex-col">
      <ChatHeader conversation={chat} onBack={onBack} onSearch={() => setSearch('')} />

      {search !== null && (
        <div className="flex items-center gap-2 border-b border-hairline px-5 py-2">
          <MagnifyingGlass aria-hidden className="size-4 text-fg-muted" />
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search in chat"
            aria-label="Search in chat"
            className="min-w-0 flex-1 bg-transparent text-body-s text-fg outline-none placeholder:text-fg-muted"
          />
          <IconButton label="Close search" onClick={() => setSearch(null)} className="size-7">
            <X className="size-4" />
          </IconButton>
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 pt-[43px] pb-6">
        <ProfileSummary conversation={chat} />
        <ol className="mt-gap-md flex flex-col gap-[37px]" aria-live="polite">
          {visible?.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </ol>
        {visible?.length === 0 && (
          <p className="mt-8 text-center text-body-s text-fg-muted">
            {search ? 'No messages match your search.' : 'No messages yet. Say hello!'}
          </p>
        )}
      </div>

      <Composer conversationId={conversationId} />
    </section>
  )
}

function ChatHeader({
  conversation,
  onBack,
  onSearch,
}: {
  conversation: Conversation
  onBack?: () => void
  onSearch: () => void
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const clear = useConversationAction('clear')
  const remove = useConversationAction('delete')
  const report = useConversationAction('report')
  const leave = useConversationAction('leave')
  const [confirm, setConfirm] = useState<'clear' | 'delete' | 'leave' | null>(null)
  const isProject = conversation.kind === 'project'
  const onError = (error: unknown) => toast(getErrorMessage(error))

  const confirmCopy = {
    clear: { title: 'Clear conversation?', message: 'All messages in this chat will be removed.', label: 'Clear' },
    delete: { title: 'Delete chat history?', message: 'This chat will be removed from your list.', label: 'Delete' },
    leave: { title: 'Leave project?', message: `You will leave ${conversation.title}.`, label: 'Leave' },
  }

  const runConfirmed = () => {
    if (confirm === 'clear') {
      clear.mutate(conversation.id, {
        onSuccess: () => {
          setConfirm(null)
          toast('Conversation cleared')
        },
        onError,
      })
    } else if (confirm === 'delete' || confirm === 'leave') {
      const mutation = confirm === 'delete' ? remove : leave
      mutation.mutate(conversation.id, {
        onSuccess: () => {
          setConfirm(null)
          toast(confirm === 'delete' ? 'Chat deleted' : 'You left the project')
          navigate(paths.chats, { replace: true })
        },
        onError,
      })
    }
  }

  return (
    <header className="flex items-center gap-2 border-b border-hairline px-[18px] py-2.5">
      {onBack && (
        <IconButton label="Back to chats" onClick={onBack} className="size-10 bg-fg/5">
          <ArrowLeft className="size-6" />
        </IconButton>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:px-5">
        <Avatar src={conversation.avatarUrl} name={conversation.title} size={45} />
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-body-m font-semibold text-fg">{conversation.title}</p>
          <p className="text-caption text-fg">{conversation.status}</p>
        </div>
      </div>
      <Menu
        title="Chat actions"
        className="w-[min(350px,calc(100vw-32px))] rounded-search"
        trigger={
          <IconButton label="Chat actions" className="size-10 bg-fg/5 p-2">
            <DotsThreeVertical weight="bold" className="size-6 text-fg" />
          </IconButton>
        }
      >
        {(close) => {
          const run = (fn: () => void) => () => {
            close()
            fn()
          }
          return (
            <>
              <MenuItem size="sm" tone="muted" icon={<MagnifyingGlass />} onSelect={run(onSearch)}>
                Search in Chat
              </MenuItem>
              <MenuItem size="sm" tone="muted" icon={<Broom />} onSelect={run(() => setConfirm('clear'))}>
                Clear conversation history
              </MenuItem>
              <MenuItem size="sm" tone="muted" icon={<Trash />} onSelect={run(() => setConfirm('delete'))}>
                Delete chat history
              </MenuItem>
              <MenuItem
                size="sm"
                tone="danger"
                icon={<User />}
                onSelect={run(() =>
                  report.mutate(conversation.id, {
                    onSuccess: () => toast(`Thanks — we’ll review this ${isProject ? 'project' : 'user'}`),
                    onError,
                  }),
                )}
              >
                {isProject ? 'Report this project' : 'Report this user'}
              </MenuItem>
              {isProject && (
                <MenuItem size="sm" tone="danger" icon={<Prohibit />} onSelect={run(() => setConfirm('leave'))}>
                  Leave project
                </MenuItem>
              )}
            </>
          )
        }}
      </Menu>

      {confirm && (
        <ConfirmDialog
          open
          title={confirmCopy[confirm].title}
          message={confirmCopy[confirm].message}
          confirmLabel={confirmCopy[confirm].label}
          loading={clear.isPending || remove.isPending || leave.isPending}
          onClose={() => setConfirm(null)}
          onConfirm={runConfirmed}
        />
      )}
    </header>
  )
}

function ProfileSummary({ conversation }: { conversation: Conversation }) {
  return (
    <div className="mx-auto flex max-w-[306px] flex-col items-center gap-4 text-center">
      <Avatar src={conversation.avatarUrl} name={conversation.title} size={85} />
      <p className="text-body-l font-semibold text-fg">{conversation.title}</p>
      <div className="flex w-full justify-center gap-1 text-body-l">
        <p className="w-[151px]">
          <span className="font-semibold text-fg">{conversation.followers}</span>{' '}
          <span className="text-fg-muted">Followers</span>
        </p>
        <p className="w-[151px]">
          <span className="font-semibold text-fg">{conversation.collaborations}</span>{' '}
          <span className="text-fg-muted">Collaborations</span>
        </p>
      </div>
      <Link
        to={conversation.profileHref}
        className="flex h-[38px] w-[176px] items-center justify-center rounded-full bg-brand-orange px-2 py-[5px] text-body-l text-white hover:brightness-95"
      >
        View Profile
      </Link>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.fromMe
  return (
    <li className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex w-fit max-w-[297px] flex-col gap-[3px] rounded-t-card px-2 py-[5px]',
          mine
            ? 'w-full rounded-bl-card bg-brand-orange text-white'
            : 'rounded-br-card border border-hairline bg-popover text-fg',
        )}
      >
        <p className={cn('text-caption', mine ? 'text-brand-green' : 'text-brand-orange')}>{message.senderName} ~~</p>
        {message.text && <p className="text-body-s break-words whitespace-pre-line">{message.text}</p>}
        {message.attachments?.map((file) =>
          file.isImage ? (
            <img key={file.url} src={file.url} alt={file.name} className="mt-1 max-h-48 rounded-control object-cover" />
          ) : (
            <a key={file.url} href={file.url} download={file.name} className="text-body-s underline">
              {file.name}
            </a>
          ),
        )}
        <time dateTime={message.sentAt} className={cn('text-caption', mine ? 'text-grey-30' : 'text-grey-40')}>
          {time(message.sentAt)}
        </time>
      </div>
    </li>
  )
}

function Composer({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const send = useSendMessage(conversationId)
  const toast = useToast()
  const imageInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const canSend = text.trim().length > 0 || files.length > 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSend) return
    send.mutate(
      { text: text.trim(), attachments: files },
      {
        onSuccess: () => {
          setText('')
          setFiles([])
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )
  }

  const onPick = (list: FileList | null) => list && setFiles((current) => [...current, ...Array.from(list)])

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 pt-[5px] pb-2">
      {files.length > 0 && (
        <AttachmentList files={files} onRemove={(file) => setFiles((current) => current.filter((f) => f !== file))} />
      )}
      <div className="flex items-center gap-1 px-2 py-[5px]">
        <div className="flex h-[38px] min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-input-fill px-2 py-[5px]">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="write a message"
            aria-label="Write a message"
            className="min-w-0 flex-1 bg-transparent text-body-s text-fg outline-none placeholder:text-fg-muted"
          />
          <div className="flex shrink-0 items-center gap-2.5 text-fg">
            <IconButton label="Attach image" onClick={() => imageInput.current?.click()} className="size-[18px]">
              <ImageIcon className="size-[18px]" />
            </IconButton>
            <IconButton label="Attach file" onClick={() => fileInput.current?.click()} className="size-[18px]">
              <Paperclip className="size-[18px]" />
            </IconButton>
          </div>
        </div>
        <button
          type={canSend ? 'submit' : 'button'}
          aria-label={canSend ? 'Send message' : 'Record voice note (coming soon)'}
          title={canSend ? 'Send' : 'Voice notes are coming soon'}
          onClick={canSend ? undefined : () => toast('Voice notes are coming soon')}
          className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-brand-orange p-[5px] text-white hover:brightness-95"
        >
          {send.isPending ? (
            <Spinner className="size-4" />
          ) : canSend ? (
            <PaperPlaneRight weight="fill" className="size-[18px]" />
          ) : (
            <Microphone weight="fill" className="size-[18px]" />
          )}
        </button>
      </div>
      <input ref={imageInput} type="file" accept="image/*" multiple hidden onChange={(e) => onPick(e.target.files)} />
      <input ref={fileInput} type="file" multiple hidden onChange={(e) => onPick(e.target.files)} />
    </form>
  )
}
