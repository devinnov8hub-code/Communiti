import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { forumsApi } from '../api/forums.service'
import type { Forum, ForumPostSort, ForumsTab, NewForum } from '../types'

export const forumKeys = {
  all: ['forums'] as const,
  list: (tab: ForumsTab) => [...forumKeys.all, 'list', tab] as const,
  detail: (id: string) => [...forumKeys.all, 'detail', id] as const,
  posts: (id: string, sort: ForumPostSort) => [...forumKeys.all, 'posts', id, sort] as const,
}

export const useForums = (tab: ForumsTab) =>
  useQuery({ queryKey: forumKeys.list(tab), queryFn: () => forumsApi.getForums(tab) })

export const useForum = (id: string) =>
  useQuery({ queryKey: forumKeys.detail(id), queryFn: () => forumsApi.getForum(id) })

export const useForumPosts = (id: string, sort: ForumPostSort, enabled: boolean) =>
  useQuery({ queryKey: forumKeys.posts(id, sort), queryFn: () => forumsApi.getForumPosts(id, sort), enabled })

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

export const useCreateForum = () => useForumMutation((input: NewForum) => forumsApi.createForum(input))
export const useForumMembership = () =>
  useForumMutation(({ id, joined }: { id: string; joined: boolean }) => forumsApi.setMembership(id, joined))
export const useMuteForum = () =>
  useForumMutation(({ id, muted }: { id: string; muted: boolean }) => forumsApi.setMuted(id, muted))
