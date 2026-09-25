export type ConversationKind = 'direct' | 'project'

export interface Conversation {
  id: string
  kind: ConversationKind
  title: string
  avatarUrl?: string
  /** Last message preview. */
  preview: string
  updatedAt: string
  unread: number
  /** "Online" for people, "12 members" for projects. */
  status: string
  /** Profile summary shown at the top of the conversation. */
  followers: number
  collaborations: number
  /** Profile or project page for "View Profile". */
  profileHref: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderName: string
  fromMe: boolean
  text: string
  attachments?: { name: string; url: string; isImage: boolean }[]
  sentAt: string
}

export interface CollaborationRequest {
  id: string
  fromName: string
  avatarUrl?: string
  message: string
  projectTitle: string
  createdAt: string
}

export type ChatListView = 'messages' | 'requests'
