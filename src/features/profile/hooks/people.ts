import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '@/features/chats/hooks/queries'
import { feedKeys } from '@/features/feed/hooks/queries'
import { chatApi, collaborationApi, usersApi, type Profile } from '@/lib/api'

/** Someone else's profile (`/people/:userId`). */
export const personKeys = {
  detail: (id: string) => ['people', id] as const,
}

export const usePerson = (id: string) =>
  useQuery({ queryKey: personKeys.detail(id), queryFn: () => usersApi.getUser(id) })

/** Patch the cached profile after an action, then refetch the counts from the server. */
function usePersonMutation<Input extends { id: string }, Result>(
  fn: (input: Input) => Promise<Result>,
  patch: (profile: Profile, input: Input, result: Result) => Partial<Profile>,
) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (result, input) => {
      client.setQueryData<Profile>(personKeys.detail(input.id), (current) =>
        current ? { ...current, ...patch(current, input, result) } : current,
      )
      client.invalidateQueries({ queryKey: personKeys.detail(input.id) })
      client.invalidateQueries({ queryKey: feedKeys.posts() })
    },
  })
}

export const useFollowPerson = () =>
  usePersonMutation(
    ({ id, follow }: { id: string; follow: boolean }) => (follow ? usersApi.followUser(id) : usersApi.unfollowUser(id)),
    (profile, { follow }) => ({
      isFollowing: follow,
      followerCount: Math.max(0, profile.followerCount + (follow ? 1 : -1)),
    }),
  )

export const useBlockPerson = () =>
  usePersonMutation(
    ({ id, block }: { id: string; block: boolean }) => (block ? usersApi.blockUser(id) : usersApi.deleteUserBlock(id)),
    (_profile, { block }) => ({ blockedByMe: block, ...(block && { isFollowing: false }) }),
  )

export const useRequestCollaboration = () =>
  usePersonMutation(
    ({ id, message }: { id: string; message?: string }) =>
      collaborationApi.createCollaborationRequest({ recipientId: id, message }),
    (_profile, _input, request) => ({
      collaborationRequest: { id: request.id, direction: 'sent', status: 'pending' },
    }),
  )

/** Withdraw a request I sent. */
export const useCancelCollaboration = () =>
  usePersonMutation(
    ({ requestId }: { id: string; requestId: string }) => collaborationApi.deleteCollaborationRequest(requestId),
    () => ({ collaborationRequest: null }),
  )

/** "Message": opens (or creates) the direct chat. Respects their "Who can message me" setting. */
export function useMessagePerson() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => chatApi.openDirectConversation({ userId }),
    onSuccess: () => client.invalidateQueries({ queryKey: chatKeys.lists() }),
  })
}
