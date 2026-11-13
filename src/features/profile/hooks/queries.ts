import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toUser } from '@/features/auth/user'
import { meApi, uploadFile, type Me, type UpdateMeBody } from '@/lib/api'
import type { Profile, ProfileUpdate } from '../types'

export const profileKeys = {
  me: ['profile', 'me'] as const,
}

const toProfile = (me: Me): Profile => ({
  id: me.id,
  name: me.fullName,
  role: me.memberRole ?? undefined,
  profession: me.headline ?? '',
  bio: me.bio ?? '',
  location: me.location || me.country || undefined,
  avatarUrl: me.avatarUrl ?? undefined,
  coverUrl: me.coverUrl ?? undefined,
  collaborations: me.collaborationCount,
  following: me.followingCount,
  followers: me.followerCount,
  postsCount: me.postCount,
  openToCollaborations: me.openToCollaborate,
})

export const useMyProfile = () =>
  useQuery({ queryKey: profileKeys.me, queryFn: () => meApi.getMe(), select: toProfile })

/** Saves to `PATCH /me`, stores the result and keeps the signed-in user (name, photo) in sync. */
function useMeMutation<Input>(toBody: (input: Input) => Promise<UpdateMeBody> | UpdateMeBody) {
  const client = useQueryClient()
  const { updateUser } = useAuth()
  return useMutation({
    mutationFn: async (input: Input) => meApi.updateMe(await toBody(input)),
    onSuccess: (me) => {
      client.setQueryData(profileKeys.me, me)
      updateUser(toUser(me))
    },
  })
}

export const useUpdateProfile = () =>
  useMeMutation(async ({ name, profession, avatar }: ProfileUpdate) => ({
    ...(name !== undefined && { fullName: name }),
    ...(profession !== undefined && { headline: profession || null }),
    // Profile photos are public files, so the upload gives a ready link.
    ...(avatar && { avatarUrl: (await uploadFile(avatar, 'avatar')).publicUrl }),
  }))

export const useSetOpenToCollaborations = () => useMeMutation((open: boolean) => ({ openToCollaborate: open }))
