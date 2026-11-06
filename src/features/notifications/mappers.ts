import { paths } from '@/app/paths'
import type { Notification, Settings } from '@/lib/api'
import type { AppNotification, NotificationCategory } from './types'

type NotificationPrefs = Settings['notificationPrefs']

/** Backend notification `type`s grouped by the tab / mute option they belong to. */
export const NOTIFICATION_TYPES: Record<NotificationCategory, string[]> = {
  messages: ['message'],
  collaborations: [
    'collaboration_request',
    'collaboration_accepted',
    'project_invite',
    'project_join_request',
    'project_join_accepted',
    'project_join_declined',
    'task_assigned',
    'task_completed',
    'expert_evaluation',
    'research_comment',
    'prototype_version',
  ],
  posts: ['follow', 'post_like', 'post_comment', 'comment_reply', 'mention'],
  forums: ['forum_join'],
  general: ['event_reminder', 'moderation', 'broadcast', 'verification'],
}

const CATEGORY_OF_TYPE = new Map(
  Object.entries(NOTIFICATION_TYPES).flatMap(([category, types]) =>
    types.map((type) => [type, category as NotificationCategory] as const),
  ),
)

const str = (value: unknown) => (typeof value === 'string' && value ? value : undefined)

/** Where tapping a notification goes, from its `targetType` + `targetId` (falls back to ids in `data`). */
function hrefFor({ type, targetType, targetId, data }: Notification): string | undefined {
  const projectId = str(data.projectId)
  const postId = str(data.postId)
  if (type === 'collaboration_request' && targetId) return paths.chatRequest(targetId)
  if (!targetId) return projectId ? paths.project(projectId) : undefined

  switch (targetType) {
    case 'user':
      return paths.person(targetId)
    case 'post':
      return paths.post(targetId)
    case 'comment':
      return postId ? paths.post(postId) : undefined
    case 'forum':
      return paths.forum(targetId)
    case 'project':
      return paths.project(targetId)
    case 'conversation':
      return paths.chat(targetId)
    case 'event':
      return paths.event(targetId)
    case 'collaboration_request':
      return paths.chatRequest(targetId)
    case 'prototype':
      return projectId ? paths.prototype(projectId, targetId) : undefined
    default:
      return projectId ? paths.project(projectId) : undefined
  }
}

/** Button copy from the Figma rows: "View Post", "Tap to view", "View request". */
function actionLabel(notification: Notification, category: NotificationCategory) {
  if (notification.type === 'collaboration_request' || notification.type === 'project_join_request')
    return 'View request'
  if (notification.targetType === 'post' || notification.targetType === 'comment') return 'View Post'
  if (notification.type === 'follow') return 'View profile'
  return category === 'messages' ? 'Tap to view' : 'View'
}

export function toAppNotification(notification: Notification): AppNotification {
  const category = CATEGORY_OF_TYPE.get(notification.type) ?? 'general'
  const href = hrefFor(notification)
  return {
    id: notification.id,
    category,
    title: notification.title,
    body: notification.body,
    createdAt: notification.createdAt,
    read: notification.read,
    avatarUrl: notification.actor?.avatarUrl ?? undefined,
    action: href ? { label: actionLabel(notification, category), href } : undefined,
  }
}

/** A category counts as muted when in-app alerts are off for every one of its types. */
export const mutedCategories = (prefs: NotificationPrefs) =>
  (Object.keys(NOTIFICATION_TYPES) as NotificationCategory[]).filter((category) =>
    NOTIFICATION_TYPES[category].every((type) => prefs[type]?.inApp === false),
  )

/**
 * The full `notificationPrefs` map for a new set of muted categories. Muting turns off in-app and push
 * alerts; email choices are left as they were.
 */
export function prefsForMuted(current: NotificationPrefs, muted: NotificationCategory[]): NotificationPrefs {
  const next = { ...current }
  for (const [category, types] of Object.entries(NOTIFICATION_TYPES)) {
    const on = !muted.includes(category as NotificationCategory)
    for (const type of types) next[type] = { email: current[type]?.email ?? true, inApp: on, push: on }
  }
  return next
}
