import { ArrowDown, ChatsCircle } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PageColumns } from '@/components/layout/AppShell'
import { EmptyState, Menu, MenuRadioItem, Tabs } from '@/components/ui'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ChatPanel } from '../components/ChatPanel'
import { ConversationRow } from '../components/ConversationRow'
import { RequestRow } from '../components/RequestRow'
import { useCollaborationRequests, useConversations } from '../hooks/queries'
import type { ChatListView, ConversationKind } from '../types'

const TABS = [
  { value: 'direct', label: 'Messages' },
  { value: 'project', label: 'Projects' },
] as const

const VIEW_LABELS: Record<ChatListView, string> = {
  messages: 'Messages',
  requests: 'Collaboration requests',
}

/** Chats and project messaging (Figma "Messaging" / "projects chat"). */
export function ChatsPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const wide = useMediaQuery('(min-width: 1280px)')
  const [tab, setTab] = useState<ConversationKind>('direct')
  const [view, setView] = useState<ChatListView>('messages')

  const panel = conversationId ? <ChatPanel key={conversationId} conversationId={conversationId} /> : <NoChatSelected />

  // Below xl there's no right rail: an open conversation takes over the page.
  if (!wide && conversationId) {
    return (
      <main className="h-[calc(100dvh-56px)] md:h-dvh">
        <ChatPanel key={conversationId} conversationId={conversationId} onBack={() => navigate(paths.chats)} />
      </main>
    )
  }

  return (
    <PageColumns aside={panel} asideClassName="p-0 min-[1440px]:p-0">
      <SearchHeader>
        <Tabs label="Chats" items={TABS} value={tab} onChange={setTab} />
      </SearchHeader>

      <div className="flex flex-col gap-gap-md px-4 pt-5 pb-2.5 sm:px-5">
        {tab === 'direct' && (
          <Menu
            align="start"
            title="Sort by"
            className="w-[min(350px,calc(100vw-32px))] rounded-search"
            trigger={
              <button
                type="button"
                className="flex w-fit items-center gap-1 text-fg-muted hover:text-fg"
                aria-label={`Showing ${VIEW_LABELS[view]}. Change view`}
              >
                <span className={view === 'messages' ? 'text-body-m' : 'text-body-s'}>{VIEW_LABELS[view]}</span>
                <ArrowDown aria-hidden className="size-[18px]" />
              </button>
            }
          >
            {(close) =>
              (Object.keys(VIEW_LABELS) as ChatListView[]).map((value) => (
                <MenuRadioItem
                  key={value}
                  checked={value === view}
                  onSelect={() => {
                    setView(value)
                    close()
                  }}
                >
                  {VIEW_LABELS[value]}
                </MenuRadioItem>
              ))
            }
          </Menu>
        )}

        {tab === 'direct' && view === 'requests' ? (
          <RequestList />
        ) : (
          <ConversationList kind={tab} activeId={conversationId} />
        )}
      </div>
    </PageColumns>
  )
}

function ConversationList({ kind, activeId }: { kind: ConversationKind; activeId?: string }) {
  const conversations = useConversations(kind)

  if (conversations.isPending) return <ListSkeleton />
  if (!conversations.data?.length) {
    return (
      <EmptyState
        title={kind === 'project' ? 'No project chats yet' : 'No messages yet'}
        description={
          kind === 'project' ? 'Join a project to chat with its team.' : 'Start a conversation from someone’s profile.'
        }
      />
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {conversations.data.map((conversation) => (
        <ConversationRow key={conversation.id} conversation={conversation} active={conversation.id === activeId} />
      ))}
    </ul>
  )
}

function RequestList() {
  const requests = useCollaborationRequests()
  if (requests.isPending) return <ListSkeleton />
  if (!requests.data?.length) {
    return <EmptyState title="No collaboration requests" description="Requests to join your projects show up here." />
  }
  return (
    <ul className="flex flex-col gap-1">
      {requests.data.map((request) => (
        <RequestRow key={request.id} request={request} />
      ))}
    </ul>
  )
}

function ListSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-1">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-2 border-b border-hairline py-3">
          <div className="size-[45px] rounded-full bg-surface dark:bg-grey-50" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-1/3 rounded bg-surface dark:bg-grey-50" />
            <div className="h-3 w-3/4 rounded bg-surface dark:bg-grey-50" />
          </div>
        </div>
      ))}
    </div>
  )
}

function NoChatSelected() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-10 text-center">
      <ChatsCircle aria-hidden className="size-12 text-brand-orange" />
      <p className="text-body-l font-semibold text-fg">Your conversations</p>
      <p className="text-body-s text-fg-muted">Select a chat to read and reply to messages.</p>
    </div>
  )
}
