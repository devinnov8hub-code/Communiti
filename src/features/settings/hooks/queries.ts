import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feedKeys } from '@/features/feed/hooks/queries'
import { notificationKeys } from '@/features/notifications/hooks/queries'
import { meApi, usersApi, type Settings, type UpdateSettingsBody } from '@/lib/api'
import type { DeleteReason } from '../types'

export const settingsKeys = {
  account: ['settings', 'account'] as const,
  /** `GET /me/settings`, shared with the notification settings screen. */
  prefs: notificationKeys.settings,
  blocked: ['settings', 'blocked'] as const,
}

export const useAccount = () => useQuery({ queryKey: settingsKeys.account, queryFn: () => meApi.getMe() })

/** Message permission, language, theme, profile visibility and notification preferences. */
export const useSettings = () => useQuery({ queryKey: settingsKeys.prefs, queryFn: () => meApi.getSettings() })

/** Saves only the fields given; the choice shows straight away and rolls back if the save fails. */
export function useUpdateSettings() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (patch: UpdateSettingsBody) => meApi.updateSettings(patch),
    onMutate: async (patch) => {
      await client.cancelQueries({ queryKey: settingsKeys.prefs })
      const previous = client.getQueryData<Settings>(settingsKeys.prefs)
      if (previous) client.setQueryData<Settings>(settingsKeys.prefs, { ...previous, ...patch } as Settings)
      return { previous }
    },
    onError: (_error, _patch, context) => client.setQueryData(settingsKeys.prefs, context?.previous),
    onSuccess: (settings) => client.setQueryData(settingsKeys.prefs, settings),
  })
}

export const useBlockedUsers = () =>
  useQuery({ queryKey: settingsKeys.blocked, queryFn: () => meApi.listBlockedUsers().then((page) => page.data) })

export function useUnblockUser() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => usersApi.deleteUserBlock(userId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: settingsKeys.blocked })
      client.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

/**
 * Schedules deletion in 30 days (signing in again before then cancels it). Accounts with a
 * password must confirm it; the chosen reasons go along as feedback.
 */
export const useDeleteAccount = () =>
  useMutation({
    mutationFn: ({ reasons, password }: { reasons: DeleteReason[]; password?: string }) =>
      meApi.deleteMe({
        confirm: 'DELETE',
        password: password || undefined,
        reason: reasons.length ? reasons.join('; ').slice(0, 500) : undefined,
      }),
  })
