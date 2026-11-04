import type { ListConversationsQuery } from '@/lib/api'

/** "Messages" shows every chat (people and projects); "Projects" only project chats. */
export type ChatsTab = Extract<NonNullable<ListConversationsQuery['filter']>, 'all' | 'project'>

export type ChatListView = 'messages' | 'requests'

export interface NewMessage {
  text: string
  attachments: File[]
  /** A recorded voice note, sent on its own. */
  voice?: { file: File; durationSeconds: number }
}
