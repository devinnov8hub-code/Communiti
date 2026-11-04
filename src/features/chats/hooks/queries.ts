import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { uploadAttachments } from '@/features/feed/hooks/queries'
import {
  chatApi,
  collaborationApi,
  projectsApi,
  uploadFile,
  type GetConversationResponse,
  type ListConversationMessagesResponse,
  type Message,
} from '@/lib/api'
import type { ChatsTab, NewMessage } from '../types'

/*
 * The backend pushes new messages over Supabase Realtime, which this app doesn't use yet,
 * so open chats and the lists refresh on a timer instead.
 */
const LIST_REFRESH = 15_000
const THREAD_REFRESH = 5_000
/** "Always": the API takes a far-future date. */
const MUTE_FOREVER = '9999-12-31T00:00:00.000Z'

export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (tab: ChatsTab) => [...chatKeys.lists(), tab] as const,
  detail: (id: string) => [...chatKeys.all, 'detail', id] as const,
  messages: (id: string, q = '') => [...chatKeys.all, 'messages', id, q] as const,
  unread: () => [...chatKeys.all, 'unread'] as const,
  requests: () => [...chatKeys.all, 'requests'] as const,
  request: (id: string) => [...chatKeys.requests(), id] as const,
}

type MessagePages = InfiniteData<ListConversationMessagesResponse>

/** Apply a change to one message wherever it's cached (the thread and any search results). */
function patchCachedMessage(
  client: QueryClient,
  message: Pick<Message, 'id' | 'conversationId'>,
  patch: Partial<Message>,
) {
  client.setQueriesData<MessagePages>(
    { queryKey: [...chatKeys.all, 'messages', message.conversationId] },
    (current) =>
      current && {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          data: page.data.map((item) => (item.id === message.id ? { ...item, ...patch } : item)),
        })),
      },
  )
}

/** Lists and the badge change whenever a chat is read, sent to, cleared or removed. */
const refreshLists = (client: QueryClient) => {
  client.invalidateQueries({ queryKey: chatKeys.lists() })
  client.invalidateQueries({ queryKey: chatKeys.unread() })
}

export const useConversations = (tab: ChatsTab) =>
  useQuery({
    queryKey: chatKeys.list(tab),
    queryFn: () => chatApi.listConversations({ filter: tab }),
    select: (page) => page.data,
    refetchInterval: LIST_REFRESH,
  })

export const useConversation = (id: string) =>
  useQuery({ queryKey: chatKeys.detail(id), queryFn: () => chatApi.getConversation(id) })

/** Newest first from the API, a page at a time; `q` is "Search in Chat". */
export const useMessages = (id: string, q = '') =>
  useInfiniteQuery({
    queryKey: chatKeys.messages(id, q),
    queryFn: ({ pageParam }) => chatApi.listConversationMessages(id, { cursor: pageParam, q: q || undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    refetchInterval: q ? false : THREAD_REFRESH,
  })

export const useUnreadMessages = () =>
  useQuery({
    queryKey: chatKeys.unread(),
    queryFn: () => chatApi.getUnreadMessageCount(),
    select: (result) => result.count,
    refetchInterval: LIST_REFRESH,
  })

export function useSendMessage(conversationId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ text, attachments, voice }: NewMessage) => {
      const mediaIds = voice
        ? [(await uploadFile(voice.file, 'message', { durationSeconds: voice.durationSeconds })).mediaId]
        : await uploadAttachments(attachments, 'message')
      return chatApi.sendMessage(conversationId, { body: text || undefined, mediaIds })
    },
    onSuccess: (message) => {
      // Show it straight away at the newest end of the thread.
      client.setQueryData<MessagePages>(
        chatKeys.messages(conversationId),
        (current) =>
          current && {
            ...current,
            pages: current.pages.map((page, index) =>
              index === 0 ? { ...page, data: [message, ...page.data] } : page,
            ),
          },
      )
      refreshLists(client)
    },
  })
}

/** Edit my message (the backend allows this for 15 minutes). */
export function useEditMessage() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => chatApi.updateMessage(id, { body }),
    onSuccess: (message) => {
      patchCachedMessage(client, message, message)
      refreshLists(client)
    },
  })
}

/** Delete my message for everyone. */
export function useDeleteMessage() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (message: Pick<Message, 'id' | 'conversationId'>) => chatApi.deleteMessage(message.id),
    onSuccess: (_data, message) => {
      patchCachedMessage(client, message, { isDeleted: true, body: null, media: [] })
      refreshLists(client)
    },
  })
}

/** Mute notifications for a chat (no end date) or unmute it. */
export function useMuteChat() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, muted }: { id: string; muted: boolean }) =>
      chatApi.setConversationMuted(id, { until: muted ? MUTE_FOREVER : null }),
    onSuccess: (_data, { id, muted }) => {
      client.setQueryData<GetConversationResponse>(
        chatKeys.detail(id),
        (current) => current && { ...current, mutedUntil: muted ? MUTE_FOREVER : null },
      )
      client.invalidateQueries({ queryKey: chatKeys.lists() })
    },
  })
}

export function useMarkRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, messageId }: { id: string; messageId?: string }) =>
      chatApi.markConversationRead(id, { messageId }),
    onSuccess: () => refreshLists(client),
  })
}

/** "Clear conversation history" keeps the chat in the list; "Delete chat history" removes it too. */
export function useClearChat(mode: 'clear' | 'delete') {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      mode === 'clear' ? chatApi.clearConversationHistory(id) : chatApi.deleteConversation(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: [...chatKeys.all, 'messages', id] })
      refreshLists(client)
    },
  })
}

/** Leaving a project chat means leaving the project. */
export function useLeaveProjectChat() {
  const client = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.removeProjectMember(projectId, user!.id),
    onSuccess: () => refreshLists(client),
  })
}

export const useCollaborationRequest = (id: string) =>
  useQuery({ queryKey: chatKeys.request(id), queryFn: () => collaborationApi.getCollaborationRequest(id) })

export const useCollaborationRequests = () =>
  useQuery({
    queryKey: chatKeys.requests(),
    queryFn: () => collaborationApi.listCollaborationRequests({ box: 'received' }),
    select: (page) => page.data,
  })

export function useRespondToRequest() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      accept ? collaborationApi.acceptCollaborationRequest(id) : collaborationApi.declineCollaborationRequest(id),
    onSuccess: (_data, { accept }) => {
      client.invalidateQueries({ queryKey: chatKeys.requests() })
      if (accept) refreshLists(client)
    },
  })
}
