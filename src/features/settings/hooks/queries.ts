import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { feedApi } from '@/features/feed/api/feed.service'
import { feedKeys } from '@/features/feed/hooks/queries'
import { profileKeys } from '@/features/profile/hooks/queries'
import { settingsApi } from '../api/settings.service'
import type { AccountSettings, DeleteReason, LanguageCode, VisibilitySettings } from '../types'

export const settingsKeys = {
  account: ['settings', 'account'] as const,
  visibility: ['settings', 'visibility'] as const,
  language: ['settings', 'language'] as const,
  blocked: ['settings', 'blocked'] as const,
}

export const useAccountSettings = () => useQuery({ queryKey: settingsKeys.account, queryFn: settingsApi.getAccount })

export function useUpdateAccountSettings() {
  const client = useQueryClient()
  const { user, updateUser } = useAuth()
  return useMutation({
    mutationFn: (input: Omit<AccountSettings, 'email'>) => settingsApi.updateAccount(input),
    onSuccess: (account) => {
      client.setQueryData(settingsKeys.account, account)
      client.invalidateQueries({ queryKey: profileKeys.me })
      if (user) {
        updateUser({ ...user, dateOfBirth: account.dateOfBirth, country: account.country, role: account.role })
      }
    },
  })
}

export const useVisibilitySettings = () =>
  useQuery({ queryKey: settingsKeys.visibility, queryFn: settingsApi.getVisibility })

export function useUpdateVisibility() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: VisibilitySettings) => settingsApi.updateVisibility(input),
    onSuccess: (visibility) => client.setQueryData(settingsKeys.visibility, visibility),
  })
}

export const useLanguage = () => useQuery({ queryKey: settingsKeys.language, queryFn: settingsApi.getLanguage })

export function useUpdateLanguage() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (language: LanguageCode) => settingsApi.updateLanguage(language),
    onSuccess: (language) => client.setQueryData(settingsKeys.language, language),
  })
}

export const useBlockedUsers = () => useQuery({ queryKey: settingsKeys.blocked, queryFn: feedApi.getBlockedUsers })

export function useUnblockUser() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => feedApi.unblockUser(userId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: settingsKeys.blocked })
      client.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

export const useSupportReport = () =>
  useMutation({ mutationFn: (message: string) => settingsApi.sendSupportReport(message) })

export const useDeleteAccount = () =>
  useMutation({ mutationFn: (reasons: DeleteReason[]) => settingsApi.deleteAccount(reasons) })
