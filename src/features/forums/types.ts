import type { ListForumPostsQuery, ListForumsQuery } from '@/lib/api'

export type ForumsTab = Extract<NonNullable<ListForumsQuery['tab']>, 'for-you' | 'joined' | 'mine'>
export type ForumPostSort = NonNullable<ListForumPostsQuery['sort']>

export interface NewForum {
  name: string
  topicIds: string[]
  about: string
  header?: File
}
