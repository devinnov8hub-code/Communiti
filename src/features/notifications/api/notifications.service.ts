import avatarDrone from '@/assets/mock/avatar-drone.webp'
import avatarFemme from '@/assets/mock/avatar-femme.webp'
import { apiRequest, USE_MOCK_API } from '@/lib/api/client'
import type { AppNotification, NotificationPreferences } from '../types'

/** Notifications API contract. See README for the endpoint list. */
export interface NotificationsApi {
  getNotifications(): Promise<AppNotification[]>
  markRead(id: string): Promise<void>
  markAllRead(): Promise<void>
  getPreferences(): Promise<NotificationPreferences>
  updatePreferences(input: NotificationPreferences): Promise<NotificationPreferences>
}

const httpNotificationsApi: NotificationsApi = {
  getNotifications: () => apiRequest('/notifications'),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),
  getPreferences: () => apiRequest('/notifications/preferences'),
  updatePreferences: (input) => apiRequest('/notifications/preferences', { method: 'PUT', body: input }),
}

/* ------------------------- Mock (Figma content) ------------------------- */

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

let notifications: AppNotification[] = [
  {
    id: 'n-1',
    category: 'posts',
    title: '321 people liked your post',
    body: 'your post is gaining recognition in Community',
    createdAt: minutesAgo(23),
    read: false,
    action: { label: 'View Post', href: '/posts/p-1' },
  },
  {
    id: 'n-2',
    category: 'messages',
    title: 'Agricultural drone',
    body: 'you have 10 new messages from this project',
    createdAt: minutesAgo(23),
    read: false,
    avatarUrl: avatarDrone,
    action: { label: 'Tap to view', href: '/chats/c-drone' },
  },
  {
    id: 'n-3',
    category: 'messages',
    title: 'Jane doe',
    body: 'you have 10 new messages',
    createdAt: minutesAgo(23),
    read: true,
    avatarUrl: avatarFemme,
  },
  {
    id: 'n-4',
    category: 'posts',
    title: '321 people liked your post',
    body: 'your post is gaining recognition in Community',
    createdAt: minutesAgo(23),
    read: true,
  },
  {
    id: 'n-5',
    category: 'posts',
    title: 'Halo added a new post',
    body: 'what do you think separates innovators from ideators...',
    createdAt: minutesAgo(23),
    read: false,
    avatarUrl: avatarFemme,
    action: { label: 'View Post', href: '/posts/p-2' },
  },
  {
    id: 'n-6',
    category: 'collaborations',
    title: 'Anita Sherman',
    body: 'wants to collaborate with you on Agricultural Drone',
    createdAt: minutesAgo(90),
    read: true,
    avatarUrl: avatarFemme,
    action: { label: 'View request', href: '/chats' },
  },
]
let preferences: NotificationPreferences = { muted: [] }

const mockNotificationsApi: NotificationsApi = {
  async getNotifications() {
    await delay()
    return notifications
  },
  async markRead(id) {
    await delay(100)
    notifications = notifications.map((item) => (item.id === id ? { ...item, read: true } : item))
  },
  async markAllRead() {
    await delay()
    notifications = notifications.map((item) => ({ ...item, read: true }))
  },
  async getPreferences() {
    await delay(150)
    return preferences
  },
  async updatePreferences(input) {
    await delay()
    preferences = input
    return preferences
  },
}

export const notificationsApi: NotificationsApi = USE_MOCK_API ? mockNotificationsApi : httpNotificationsApi
