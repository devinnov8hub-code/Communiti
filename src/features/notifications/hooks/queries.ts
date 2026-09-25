import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications.service'
import type { AppNotification, NotificationPreferences } from '../types'

export const notificationKeys = {
  list: ['notifications', 'list'] as const,
  preferences: ['notifications', 'preferences'] as const,
}

export const useNotifications = () =>
  useQuery({ queryKey: notificationKeys.list, queryFn: notificationsApi.getNotifications, refetchInterval: 60_000 })

/** Unread count for the sidebar/top-bar badge. */
export function useUnreadCount() {
  const notifications = useNotifications()
  return notifications.data?.filter((item) => !item.read).length ?? 0
}

export function useMarkNotificationRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: (id) =>
      client.setQueryData<AppNotification[]>(notificationKeys.list, (current) =>
        current?.map((item) => (item.id === id ? { ...item, read: true } : item)),
      ),
  })
}

export function useMarkAllRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () =>
      client.setQueryData<AppNotification[]>(notificationKeys.list, (current) =>
        current?.map((item) => ({ ...item, read: true })),
      ),
  })
}

export const useNotificationPreferences = () =>
  useQuery({ queryKey: notificationKeys.preferences, queryFn: notificationsApi.getPreferences })

export function useUpdateNotificationPreferences() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NotificationPreferences) => notificationsApi.updatePreferences(input),
    onSuccess: (preferences) => client.setQueryData(notificationKeys.preferences, preferences),
  })
}
