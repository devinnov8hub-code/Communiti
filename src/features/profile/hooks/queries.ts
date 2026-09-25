import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { profileApi } from '../api/profile.service'
import type { NewExperience, Profile, ProfileUpdate } from '../types'

export const profileKeys = {
  me: ['profile', 'me'] as const,
  skillOptions: ['profile', 'skill-options'] as const,
}

export const useMyProfile = () => useQuery({ queryKey: profileKeys.me, queryFn: profileApi.getMyProfile })

export const useSkillOptions = () =>
  useQuery({ queryKey: profileKeys.skillOptions, queryFn: profileApi.getSkillOptions, staleTime: Infinity })

/** Shared onSuccess: store the returned profile and keep the auth user in sync. */
function useProfileMutation<Input>(fn: (input: Input) => Promise<Profile>) {
  const client = useQueryClient()
  const { user, updateUser } = useAuth()
  return useMutation({
    mutationFn: fn,
    onSuccess: (profile) => {
      client.setQueryData(profileKeys.me, profile)
      if (user) {
        const [firstName, ...rest] = profile.name.trim().split(/\s+/)
        updateUser({ ...user, firstName, lastName: rest.join(' '), role: profile.role, avatarUrl: profile.avatarUrl })
      }
    },
  })
}

export const useUpdateProfile = () => useProfileMutation((input: ProfileUpdate) => profileApi.updateProfile(input))
export const useSetOpenToCollaborations = () =>
  useProfileMutation((open: boolean) => profileApi.setOpenToCollaborations(open))
export const useSetSkills = () => useProfileMutation((skills: string[]) => profileApi.setSkills(skills))
export const useAddExperience = () => useProfileMutation((input: NewExperience) => profileApi.addExperience(input))
export const useRemoveExperience = () => useProfileMutation((id: string) => profileApi.removeExperience(id))
