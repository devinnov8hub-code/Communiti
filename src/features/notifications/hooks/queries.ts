import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { meApi, notificationsApi, type ListNotificationsResponse, type Settings } from '@/lib/api'
import { mutedCategories, prefsForMuted, toAppNotification } from '../mappers'
import type { NotificationPreferences } from '../types'

/** The backend pushes new notifications over Supabase Realtime, which this app doesn't use yet, so poll. */
const REFRESH = 60_000

export const notificationKeys = {
  all: ['notifications'] as const,
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread'] as const,
  settings: ['me', 'settings'] as const,
}

type Pages = InfiniteData<ListNotificationsResponse, string | undefined>

/** Newest first, a page at a time. */
export const useNotifications = () =>
  useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) => notificationsApi.listNotifications({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.data.map(toAppNotification)),
    refetchInterval: REFRESH,
  })

/** Unread count for the sidebar/top-bar badge. */
export function useUnreadCount() {
  const unread = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notificationsApi.getUnreadNotificationCount(),
    select: (result) => result.count,
    refetchInterval: REFRESH,
  })
  return unread.data ?? 0
}

/** Marks rows read in the cached pages (both for one id and for "all"). */
function useMarkRead<Input>(fn: (input: Input) => Promise<void>, isTarget: (input: Input, id: string) => boolean) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onMutate: (input) =>
      client.setQueryData<Pages>(
        notificationKeys.list,
        (current) =>
          current && {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              data: page.data.map((item) => (isTarget(input, item.id) ? { ...item, read: true } : item)),
            })),
          },
      ),
    onSettled: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export const useMarkNotificationRead = () =>
  useMarkRead(
    (id: string) => notificationsApi.markNotificationsRead({ ids: [id] }),
    (id, itemId) => id === itemId,
  )

export const useMarkAllRead = () =>
  useMarkRead(
    () => notificationsApi.markNotificationsRead({ all: true }),
    () => true,
  )

/** Mute options live in `/me/settings` → `notificationPrefs` (one entry per notification type). */
export const useNotificationPreferences = () =>
  useQuery({
    queryKey: notificationKeys.settings,
    queryFn: () => meApi.getSettings(),
    select: (settings): NotificationPreferences => ({ muted: mutedCategories(settings.notificationPrefs) }),
  })

export function useUpdateNotificationPreferences() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ muted }: NotificationPreferences) => {
      const current = client.getQueryData<Settings>(notificationKeys.settings) ?? (await meApi.getSettings())
      return meApi.updateSettings({ notificationPrefs: prefsForMuted(current.notificationPrefs, muted) })
    },
    onSuccess: (settings) => client.setQueryData(notificationKeys.settings, settings),
  })
}
