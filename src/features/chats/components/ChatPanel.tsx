import { ArrowLeft, Broom, DotsThreeVertical, MagnifyingGlass, Prohibit, Trash, User, X } from '@phosphor-icons/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar, ConfirmDialog, IconButton, Menu, MenuItem, MenuRadioItem, Spinner, useToast } from '@/components/ui'
import { ReportModal } from '@/features/feed/components/ReportModal'
import type { GetConversationResponse as ConversationDetail, Message } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { shortAgo } from '../format'
import {
  useClearChat,
  useConversation,
  useDeleteMessage,
  useLeaveProjectChat,
  useMarkRead,
  useMessages,
  useMuteChat,
} from '../hooks/queries'
import { ChatComposer } from './ChatComposer'
import { MessageBubble } from './MessageBubble'

interface ChatPanelProps {
  conversationId: string
  /** Show a back button (full-page view on smaller screens). */
  onBack?: () => void
}

/** Conversation view — right bar of "projects chat" in Figma. */
export function ChatPanel({ conversationId, onBack }: ChatPanelProps) {
  const conversation = useConversation(conversationId)
  const [search, setSearch] = useState<string | null>(null)
  const query = useDebounced(search?.trim() ?? '', 300)
  const messages = useMessages(conversationId, query)
  const { mutate: markRead } = useMarkRead()
  const [editing, setEditing] = useState<Message | null>(null)
  const [deleting, setDeleting] = useState<Message | null>(null)
  const deleteMessage = useDeleteMessage()
  const toast = useToast()
  const now = useNow(60_000)
  const scrollRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  // The API pages newest first; the thread reads oldest → newest.
  const thread = useMemo(() => messages.data?.pages.flatMap((page) => page.data).reverse() ?? [], [messages.data])
  const newest = thread.at(-1)
  const oldest = thread[0]

  // Keep the newest message in view as messages arrive.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [newest?.id])

  // Older messages load in above: hold the reader's place instead of jumping.
  const fromBottom = useRef<number | null>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = messages
  const loadOlder = () => {
    const box = scrollRef.current
    if (!box || !hasNextPage || isFetchingNextPage) return
    fromBottom.current = box.scrollHeight - box.scrollTop
    void fetchNextPage()
  }
  useLayoutEffect(() => {
    const box = scrollRef.current
    if (!box || fromBottom.current === null) return
    box.scrollTop = box.scrollHeight - fromBottom.current
    fromBottom.current = null
  }, [oldest?.id])

  // …and they load by themselves when the reader scrolls up to the top.
  const loadOlderRef = useRef(loadOlder)
  useLayoutEffect(() => {
    loadOlderRef.current = loadOlder
  })
  useEffect(() => {
    const top = topRef.current
    if (!top || !hasNextPage) return
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && loadOlderRef.current(), {
      root: scrollRef.current,
      rootMargin: '200px 0px 0px 0px',
    })
    observer.observe(top)
    return () => observer.disconnect()
  }, [hasNextPage, conversation.isSuccess])

  // Mark read on open if there's anything unread, then whenever someone else's message arrives.
  const unread = conversation.data?.unreadCount ?? 0
  const lastRead = useRef<string | null>(null)
  useEffect(() => {
    if (!newest || query || newest.id === lastRead.current) return
    const opening = lastRead.current === null
    lastRead.current = newest.id
    if (opening ? unread > 0 : !newest.isMine) markRead({ id: conversationId, messageId: newest.id })
  }, [newest, query, unread, conversationId, markRead])

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
            maxLength={80}
            className="min-w-0 flex-1 bg-transparent text-body-s text-fg outline-none placeholder:text-fg-muted"
          />
          <IconButton label="Close search" onClick={() => setSearch(null)} className="size-7">
            <X className="size-4" />
          </IconButton>
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 pt-[43px] pb-6">
        {!query && <ProfileSummary conversation={chat} />}
        <div ref={topRef} aria-hidden />
        {hasNextPage && (
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={loadOlder}
            className="mx-auto mt-gap-md flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-caption text-fg hover:bg-fg/5"
          >
            {isFetchingNextPage && <Spinner className="size-3.5" />}
            {isFetchingNextPage ? 'Loading earlier messages' : 'Load earlier messages'}
          </button>
        )}
        {messages.isPending ? (
          <div className="mt-8 flex justify-center">
            <Spinner className="text-brand-orange" />
          </div>
        ) : messages.isError ? (
          <p className="mt-8 text-center text-body-s text-fg-muted">{getErrorMessage(messages.error)}</p>
        ) : thread.length === 0 ? (
          <p className="mt-8 text-center text-body-s text-fg-muted">
            {query ? 'No messages match your search.' : 'No messages yet. Say hello!'}
          </p>
        ) : (
          <ol className="mt-gap-md flex flex-col gap-[37px]" aria-live="polite">
            {thread.map((message) => (
              <MessageBubble key={message.id} message={message} now={now} onEdit={setEditing} onDelete={setDeleting} />
            ))}
          </ol>
        )}
      </div>

      <ChatComposer conversationId={conversationId} editing={editing} onDoneEditing={() => setEditing(null)} />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete message?"
        message="It will be removed for everyone in this chat."
        confirmLabel="Delete"
        loading={deleteMessage.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          deleteMessage.mutate(deleting, {
            onSuccess: () => {
              if (editing?.id === deleting.id) setEditing(null)
              setDeleting(null)
            },
            onError: (error) => toast(getErrorMessage(error)),
          })
        }
      />
    </section>
  )
}

/** The time, refreshed every `ms`. */
function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(timer)
  }, [ms])
  return now
}

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return debounced
}

/** "Online" / "Active 5 mins ago" for people, "12 members" for projects. */
function statusLine(chat: ConversationDetail) {
  if (chat.kind === 'project') return `${chat.members.length} member${chat.members.length === 1 ? '' : 's'}`
  const profile = chat.otherUserProfile
  if (profile?.online) return 'Online'
  return profile?.lastSeenAt ? `Active ${shortAgo(profile.lastSeenAt)} ago` : ''
}

const isMuted = (chat: ConversationDetail) => !!chat.mutedUntil && new Date(chat.mutedUntil).getTime() > Date.now()

type Confirm = 'clear' | 'delete' | 'leave'

function ChatHeader({
  conversation,
  onBack,
  onSearch,
}: {
  conversation: ConversationDetail
  onBack?: () => void
  onSearch: () => void
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const clear = useClearChat('clear')
  const remove = useClearChat('delete')
  const leave = useLeaveProjectChat()
  const mute = useMuteChat()
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [reporting, setReporting] = useState(false)
  const { project, otherUser } = conversation
  const muted = isMuted(conversation)
  const onError = (error: unknown) => toast(getErrorMessage(error))

  const confirmCopy: Record<Confirm, { title: string; message: string; label: string }> = {
    clear: {
      title: 'Clear conversation?',
      message: 'All messages in this chat will be removed for you. The chat stays in your list.',
      label: 'Clear',
    },
    delete: {
      title: 'Delete chat history?',
      message: 'This chat will be removed from your list. It comes back if a new message arrives.',
      label: 'Delete',
    },
    leave: { title: 'Leave project?', message: `You will leave ${conversation.title} and its chat.`, label: 'Leave' },
  }

  const done = (message: string, exit: boolean) => () => {
    setConfirm(null)
    toast(message)
    if (exit) navigate(paths.chats, { replace: true })
  }

  const runConfirmed = () => {
    if (confirm === 'clear') clear.mutate(conversation.id, { onSuccess: done('Conversation cleared', false), onError })
    if (confirm === 'delete') remove.mutate(conversation.id, { onSuccess: done('Chat deleted', true), onError })
    if (confirm === 'leave' && project)
      leave.mutate(project.id, { onSuccess: done('You left the project', true), onError })
  }

  return (
    <header className="flex items-center gap-2 border-b border-hairline px-[18px] py-2.5">
      {onBack && (
        <IconButton label="Back to chats" onClick={onBack} className="size-10 bg-fg/5">
          <ArrowLeft className="size-6" />
        </IconButton>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:px-5">
        <Avatar src={conversation.avatarUrl ?? undefined} name={conversation.title} size={45} />
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-body-m font-semibold text-fg">{conversation.title}</p>
          <p className="text-caption text-fg">{statusLine(conversation)}</p>
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
              <MenuRadioItem
                checked={muted}
                onSelect={() =>
                  mute.mutate(
                    { id: conversation.id, muted: !muted },
                    { onSuccess: () => toast(muted ? 'Notifications unmuted' : 'Notifications muted'), onError },
                  )
                }
              >
                <span className="text-body-s text-fg-muted">Mute notifications</span>
              </MenuRadioItem>
              <MenuItem size="sm" tone="muted" icon={<Broom />} onSelect={run(() => setConfirm('clear'))}>
                Clear conversation history
              </MenuItem>
              <MenuItem size="sm" tone="muted" icon={<Trash />} onSelect={run(() => setConfirm('delete'))}>
                Delete chat history
              </MenuItem>
              {(project || otherUser) && (
                <MenuItem size="sm" tone="danger" icon={<User />} onSelect={run(() => setReporting(true))}>
                  {project ? 'Report this project' : 'Report this user'}
                </MenuItem>
              )}
              {project && (
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
      {reporting && (
        <ReportModal
          target={project ? 'project' : 'user'}
          targetId={project?.id ?? otherUser?.id ?? ''}
          onClose={() => setReporting(false)}
        />
      )}
    </header>
  )
}

const viewButton =
  'flex h-[38px] w-[176px] items-center justify-center rounded-full bg-brand-orange px-2 py-[5px] text-body-l text-white hover:brightness-95'

/** The card at the start of every chat (Figma: avatar, name, counts, "View Profile"). */
function ProfileSummary({ conversation }: { conversation: ConversationDetail }) {
  const { project, otherUser, otherUserProfile: profile } = conversation
  return (
    <div className="mx-auto flex max-w-[306px] flex-col items-center gap-4 text-center">
      <Avatar src={conversation.avatarUrl ?? undefined} name={conversation.title} size={85} />
      <p className="text-body-l font-semibold text-fg">{conversation.title}</p>
      {profile && (
        <div className="flex w-full justify-center gap-1 text-body-l">
          <p className="w-[151px]">
            <span className="font-semibold text-fg">{profile.followerCount}</span>{' '}
            <span className="text-fg-muted">Followers</span>
          </p>
          <p className="w-[151px]">
            <span className="font-semibold text-fg">{profile.collaborationCount}</span>{' '}
            <span className="text-fg-muted">Collaborations</span>
          </p>
        </div>
      )}
      {project && <p className="text-body-l text-fg-muted">{statusLine(conversation)}</p>}
      {(project || otherUser) && (
        <Link to={project ? paths.project(project.id) : paths.person(otherUser!.id)} className={viewButton}>
          {project ? 'View Project' : 'View Profile'}
        </Link>
      )}
    </div>
  )
}
