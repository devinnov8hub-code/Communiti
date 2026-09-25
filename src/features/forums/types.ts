import type { TagTone } from '@/components/ui/Tag'

export type ForumsTab = 'for-you' | 'joined' | 'mine'
export type ForumPostSort = 'latest' | 'popular' | 'my-posts' | 'my-replies'

export interface ForumMember {
  id: string
  name: string
  avatarUrl?: string
}

export interface Forum {
  id: string
  name: string
  description: string
  createdAt: string
  topics: { label: string; tone: TagTone }[]
  coverUrl?: string
  /** Wide banner on the forum page; falls back to coverUrl. */
  headerUrl?: string
  membersCount: number
  members: ForumMember[]
  joined: boolean
  isMine: boolean
  muted: boolean
}

export interface NewForum {
  name: string
  topics: string[]
  about: string
  header?: File
}
