/** `general` covers system notices (events, moderation, broadcasts, verification) — shown under "All" only. */
export type NotificationCategory = 'messages' | 'collaborations' | 'posts' | 'forums' | 'general'
export type NotificationsTab = 'all' | 'messages' | 'collaborations' | 'posts'

export interface AppNotification {
  id: string
  category: NotificationCategory
  /** Bold lead-in, e.g. "321 people liked your post". */
  title: string
  body: string
  createdAt: string
  read: boolean
  /** Person/project avatar; when absent a category icon is shown. */
  avatarUrl?: string
  action?: { label: string; href: string }
}

export interface NotificationPreferences {
  muted: NotificationCategory[]
}
