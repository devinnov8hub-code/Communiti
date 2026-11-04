import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feedKeys } from '@/features/feed/hooks/queries'
import { forumsApi, uploadFile, type Forum } from '@/lib/api'
import type { ForumPostSort, ForumsTab, NewForum } from '../types'

export const forumKeys = {
  all: ['forums'] as const,
  list: (tab: ForumsTab) => [...forumKeys.all, 'list', tab] as const,
  detail: (id: string) => [...forumKeys.all, 'detail', id] as const,
  members: (id: string) => [...forumKeys.all, 'members', id] as const,
  // Under the feed's post keys so likes, deletes and blocks update forum posts too.
  posts: (id: string, sort: ForumPostSort) => [...feedKeys.posts(), 'forum', id, sort] as const,
}

export const useForums = (tab: ForumsTab) =>
  useQuery({ queryKey: forumKeys.list(tab), queryFn: () => forumsApi.listForums({ tab }).then((page) => page.data) })

export const useForum = (id: string) =>
  useQuery({ queryKey: forumKeys.detail(id), queryFn: () => forumsApi.getForum(id) })

export const useForumPosts = (id: string, sort: ForumPostSort, enabled: boolean) =>
  useQuery({
    queryKey: forumKeys.posts(id, sort),
    queryFn: () => forumsApi.listForumPosts(id, { sort }).then((page) => page.data),
    enabled,
  })

function useForumMutation<Input>(fn: (input: Input) => Promise<Forum>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (forum) => {
      client.setQueryData<Forum>(forumKeys.detail(forum.id), forum)
      client.invalidateQueries({ queryKey: [...forumKeys.all, 'list'] })
    },
  })
}

export const useCreateForum = () =>
  useForumMutation(async ({ header, ...input }: NewForum) =>
    forumsApi.createForum({ ...input, coverUrl: header ? (await uploadFile(header, 'forum')).publicUrl : null }),
  )

export const useMuteForum = () =>
  useForumMutation(({ id, muted }: { id: string; muted: boolean }) => forumsApi.muteForum(id, { muted }))

export const useJoinForum = () => useForumMutation((id: string) => forumsApi.joinForum(id))

export function useLeaveForum() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => forumsApi.leaveForum(id),
    // Leaving returns nothing, so refetch the forum (it may now be hidden if private).
    onSuccess: () => client.invalidateQueries({ queryKey: forumKeys.all }),
  })
}

export const useUpdateForum = () =>
  useForumMutation(async ({ id, header, ...input }: NewForum & { id: string }) =>
    forumsApi.updateForum(id, {
      ...input,
      // Only a newly picked header is uploaded; otherwise the current cover stays.
      ...(header && { coverUrl: (await uploadFile(header, 'forum')).publicUrl }),
    }),
  )

export function useDeleteForum() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => forumsApi.deleteForum(id),
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: forumKeys.detail(id) })
      client.invalidateQueries({ queryKey: [...forumKeys.all, 'list'] })
    },
  })
}

export const useForumMembers = (id: string) =>
  useQuery({
    queryKey: forumKeys.members(id),
    queryFn: () => forumsApi.listForumMembers(id, { limit: 50 }).then((page) => page.data),
  })

export function useSetForumRole() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userId, role }: { id: string; userId: string; role: 'moderator' | 'member' }) =>
      forumsApi.setForumMember(id, { userId, role }),
    onSuccess: (_data, { id }) => client.invalidateQueries({ queryKey: forumKeys.members(id) }),
  })
}

export function useRemoveForumMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => forumsApi.removeForumMember(id, userId),
    onSuccess: (_data, { id }) => {
      client.invalidateQueries({ queryKey: forumKeys.members(id) })
      client.invalidateQueries({ queryKey: forumKeys.detail(id) })
    },
  })
}
