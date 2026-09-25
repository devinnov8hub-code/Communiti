import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatsApi } from '../api/chats.service'
import type { ChatMessage, ConversationKind } from '../types'

export const chatKeys = {
  all: ['chats'] as const,
  list: (kind: ConversationKind) => [...chatKeys.all, 'list', kind] as const,
  detail: (id: string) => [...chatKeys.all, 'detail', id] as const,
  messages: (id: string) => [...chatKeys.all, 'messages', id] as const,
  requests: () => [...chatKeys.all, 'requests'] as const,
}

export const useConversations = (kind: ConversationKind) =>
  useQuery({ queryKey: chatKeys.list(kind), queryFn: () => chatsApi.getConversations(kind) })

export const useConversation = (id: string | undefined) =>
  useQuery({ queryKey: chatKeys.detail(id ?? ''), queryFn: () => chatsApi.getConversation(id!), enabled: Boolean(id) })

export const useMessages = (id: string | undefined) =>
  useQuery({ queryKey: chatKeys.messages(id ?? ''), queryFn: () => chatsApi.getMessages(id!), enabled: Boolean(id) })

export const useCollaborationRequests = () => useQuery({ queryKey: chatKeys.requests(), queryFn: chatsApi.getRequests })

export function useSendMessage(conversationId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { text: string; attachments: File[] }) => chatsApi.sendMessage({ conversationId, ...input }),
    onSuccess: (message) => {
      client.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (current = []) => [...current, message])
      client.invalidateQueries({ queryKey: [...chatKeys.all, 'list'] })
    },
  })
}

export function useMarkRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chatsApi.markRead(id),
    onSuccess: () => client.invalidateQueries({ queryKey: [...chatKeys.all, 'list'] }),
  })
}

/** Clear / delete / report / leave — all refresh the chat lists afterwards. */
export function useConversationAction(action: 'clear' | 'delete' | 'report' | 'leave') {
  const client = useQueryClient()
  const fn = {
    clear: chatsApi.clearHistory,
    delete: chatsApi.deleteConversation,
    report: chatsApi.reportConversation,
    leave: chatsApi.leaveProject,
  }[action]
  return useMutation({
    mutationFn: (id: string) => fn(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: chatKeys.messages(id) })
      client.invalidateQueries({ queryKey: [...chatKeys.all, 'list'] })
    },
  })
}

export function useRespondToRequest() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => chatsApi.respondToRequest(id, accept),
    onSuccess: () => client.invalidateQueries({ queryKey: chatKeys.requests() }),
  })
}
