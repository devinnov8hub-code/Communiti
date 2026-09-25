import avatarJemima from '@/assets/mock/avatar-jemima.webp'
import avatarRobot from '@/assets/mock/avatar-robot.webp'
import avatarSasha from '@/assets/mock/avatar-sasha.webp'
import avatarTerryLg from '@/assets/mock/avatar-terry-lg.webp'
import { apiRequest, ApiError, USE_MOCK_API } from '@/lib/api/client'
import type { ChatMessage, CollaborationRequest, Conversation, ConversationKind } from '../types'

/** Chats API contract. See README for the endpoint list. */
export interface ChatsApi {
  getConversations(kind: ConversationKind): Promise<Conversation[]>
  getConversation(id: string): Promise<Conversation>
  getMessages(conversationId: string): Promise<ChatMessage[]>
  sendMessage(input: { conversationId: string; text: string; attachments: File[] }): Promise<ChatMessage>
  markRead(conversationId: string): Promise<void>
  clearHistory(conversationId: string): Promise<void>
  deleteConversation(conversationId: string): Promise<void>
  reportConversation(conversationId: string): Promise<void>
  leaveProject(conversationId: string): Promise<void>
  getRequests(): Promise<CollaborationRequest[]>
  respondToRequest(id: string, accept: boolean): Promise<void>
}

const httpChatsApi: ChatsApi = {
  getConversations: (kind) => apiRequest(`/conversations?kind=${kind}`),
  getConversation: (id) => apiRequest(`/conversations/${id}`),
  getMessages: (id) => apiRequest(`/conversations/${id}/messages`),
  sendMessage: ({ conversationId, text, attachments }) => {
    const form = new FormData()
    form.append('text', text)
    attachments.forEach((file) => form.append('attachments', file))
    return apiRequest(`/conversations/${conversationId}/messages`, { method: 'POST', body: form })
  },
  markRead: (id) => apiRequest(`/conversations/${id}/read`, { method: 'POST' }),
  clearHistory: (id) => apiRequest(`/conversations/${id}/messages`, { method: 'DELETE' }),
  deleteConversation: (id) => apiRequest(`/conversations/${id}`, { method: 'DELETE' }),
  reportConversation: (id) => apiRequest(`/conversations/${id}/reports`, { method: 'POST' }),
  leaveProject: (id) => apiRequest(`/conversations/${id}/leave`, { method: 'POST' }),
  getRequests: () => apiRequest('/collaboration-requests'),
  respondToRequest: (id, accept) =>
    apiRequest(`/collaboration-requests/${id}`, {
      method: 'PATCH',
      body: { status: accept ? 'accepted' : 'declined' },
    }),
}

/* ------------------------- Mock (Figma content) ------------------------- */

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()
const PREVIEW = 'I would like to connect with a bright mind like yours, how would you like to be paid?.'

const person = (id: string, title: string, avatarUrl: string, hours: number, unread = 0): Conversation => ({
  id,
  kind: 'direct',
  title,
  avatarUrl,
  preview: PREVIEW,
  updatedAt: hoursAgo(hours),
  unread,
  status: 'Online',
  followers: 43,
  collaborations: 13,
  profileHref: '/profile',
})

let conversations: Conversation[] = [
  {
    id: 'c-robot',
    kind: 'project',
    title: 'Mechanical robot project',
    avatarUrl: avatarRobot,
    preview: PREVIEW,
    updatedAt: hoursAgo(20),
    unread: 4,
    status: '12 members',
    followers: 43,
    collaborations: 13,
    profileHref: '/projects/pr-1',
  },
  person('d-sasha', 'Sasha Bankson', avatarSasha, 20),
  person('d-rita', 'Rita Nkuruma', avatarRobot, 21),
  person('d-anita', 'Anita Sherman', avatarSasha, 22),
  { ...person('d-terry', 'Terry Jameson', avatarTerryLg, 23), preview: 'Yes sir i will get to that ASAP.' },
  {
    id: 'c-drone',
    kind: 'project',
    title: 'Agricultural Drone',
    avatarUrl: avatarJemima,
    preview: 'The Mechanicakl BOM is ready to deliver',
    updatedAt: hoursAgo(26),
    unread: 0,
    status: '12 members',
    followers: 43,
    collaborations: 13,
    profileHref: '/projects/pr-1',
  },
]

const seedThread = (conversationId: string): ChatMessage[] => [
  {
    id: `${conversationId}-1`,
    conversationId,
    senderName: 'Engnr Chuks',
    fromMe: false,
    text: 'The Mechanicakl BOM is ready to deliver',
    sentAt: hoursAgo(3),
  },
  {
    id: `${conversationId}-2`,
    conversationId,
    senderName: 'You',
    fromMe: true,
    text: 'Okay Anita can you check it out and begin the process of documentation?',
    sentAt: hoursAgo(2.9),
  },
  {
    id: `${conversationId}-3`,
    conversationId,
    senderName: 'Anita somoga',
    fromMe: false,
    text: 'Yes sir i will get to that ASAP.',
    sentAt: hoursAgo(2.8),
  },
]

const threads = new Map<string, ChatMessage[]>()
const thread = (id: string) => {
  if (!threads.has(id)) threads.set(id, seedThread(id))
  return threads.get(id)!
}

let requests: CollaborationRequest[] = [
  {
    id: 'r-1',
    fromName: 'Mechanical robot project',
    avatarUrl: avatarRobot,
    message: 'I would like to collab with you on a project that does a few things',
    projectTitle: 'Mechanical robot project',
    createdAt: hoursAgo(5),
  },
  {
    id: 'r-2',
    fromName: 'Anita Sherman',
    avatarUrl: avatarSasha,
    message: 'I would like to collab with you on a project that does a few things',
    projectTitle: 'Agricultural Drone',
    createdAt: hoursAgo(9),
  },
]

const find = (id: string) => {
  const conversation = conversations.find((item) => item.id === id)
  if (!conversation) throw new ApiError('This conversation is no longer available.', 404)
  return conversation
}
const update = (id: string, patch: Partial<Conversation>) => {
  conversations = conversations.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

const mockChatsApi: ChatsApi = {
  async getConversations(kind) {
    await delay()
    return conversations
      .filter((item) => item.kind === kind || (kind === 'direct' && item.id === 'c-robot'))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  async getConversation(id) {
    await delay(150)
    return find(id)
  },
  async getMessages(id) {
    await delay()
    find(id)
    return [...thread(id)]
  },
  async sendMessage({ conversationId, text, attachments }) {
    await delay(200)
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId,
      senderName: 'You',
      fromMe: true,
      text,
      attachments: attachments.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        isImage: file.type.startsWith('image/'),
      })),
      sentAt: new Date().toISOString(),
    }
    threads.set(conversationId, [...thread(conversationId), message])
    update(conversationId, { preview: text || attachments[0]?.name || '', updatedAt: message.sentAt })
    return message
  },
  async markRead(id) {
    await delay(100)
    update(id, { unread: 0 })
  },
  async clearHistory(id) {
    await delay()
    threads.set(id, [])
    update(id, { preview: '' })
  },
  async deleteConversation(id) {
    await delay()
    conversations = conversations.filter((item) => item.id !== id)
    threads.delete(id)
  },
  async reportConversation() {
    await delay()
  },
  async leaveProject(id) {
    await delay()
    conversations = conversations.filter((item) => item.id !== id)
  },
  async getRequests() {
    await delay()
    return requests
  },
  async respondToRequest(id) {
    await delay()
    requests = requests.filter((item) => item.id !== id)
  },
}

export const chatsApi: ChatsApi = USE_MOCK_API ? mockChatsApi : httpChatsApi
