import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { feedApi } from '../api/feed.service'
import type { Comment, CommentSort, FeedTab, NewComment, NewPost, Post, ReportReason } from '../types'

export const feedKeys = {
  all: ['feed'] as const,
  posts: () => [...feedKeys.all, 'posts'] as const,
  list: (tab: FeedTab) => [...feedKeys.posts(), 'list', tab] as const,
  user: (userId: string) => [...feedKeys.posts(), 'user', userId] as const,
  detail: (id: string) => [...feedKeys.posts(), 'detail', id] as const,
  search: (query: string, topic?: string) => [...feedKeys.posts(), 'search', query, topic ?? ''] as const,
  comments: (postId: string, sort: CommentSort) => [...feedKeys.all, 'comments', postId, sort] as const,
  trending: () => [...feedKeys.all, 'trending'] as const,
  events: () => [...feedKeys.all, 'events'] as const,
  topics: () => [...feedKeys.all, 'topics'] as const,
}

/* ----------------------------- Queries ----------------------------- */

export const useFeed = (tab: FeedTab) => useQuery({ queryKey: feedKeys.list(tab), queryFn: () => feedApi.getFeed(tab) })

export const useUserPosts = (userId: string) =>
  useQuery({ queryKey: feedKeys.user(userId), queryFn: () => feedApi.getUserPosts(userId) })

export const usePost = (id: string) => useQuery({ queryKey: feedKeys.detail(id), queryFn: () => feedApi.getPost(id) })

export const useComments = (postId: string, sort: CommentSort) =>
  useQuery({ queryKey: feedKeys.comments(postId, sort), queryFn: () => feedApi.getComments(postId, sort) })

export const useSearchPosts = (query: string, topic?: string) =>
  useQuery({
    queryKey: feedKeys.search(query, topic),
    queryFn: () => feedApi.searchPosts({ query, topic }),
    enabled: Boolean(query || topic),
  })

export const useTrending = () =>
  useQuery({ queryKey: feedKeys.trending(), queryFn: feedApi.getTrending, staleTime: 5 * 60_000 })

export const useEvents = () =>
  useQuery({ queryKey: feedKeys.events(), queryFn: feedApi.getEvents, staleTime: 5 * 60_000 })

export const useSearchTopics = () =>
  useQuery({ queryKey: feedKeys.topics(), queryFn: feedApi.getSearchTopics, staleTime: Infinity })

/* ---------------------------- Mutations ---------------------------- */

/** Applies `patch` to a post wherever it is cached (lists, search results, detail). */
function patchCachedPost(client: QueryClient, id: string, patch: (post: Post) => Post) {
  client.setQueriesData<Post[] | Post>({ queryKey: feedKeys.posts() }, (data) => {
    if (!data) return data
    if (Array.isArray(data)) return data.map((post) => (post.id === id ? patch(post) : post))
    return data.id === id ? patch(data) : data
  })
}

function removeCachedPosts(client: QueryClient, predicate: (post: Post) => boolean) {
  client.setQueriesData<Post[] | Post>({ queryKey: feedKeys.posts() }, (data) =>
    Array.isArray(data) ? data.filter((post) => !predicate(post)) : data,
  )
}

export function useCreatePost() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NewPost) => feedApi.createPost(input),
    onSuccess: () => client.invalidateQueries({ queryKey: feedKeys.posts() }),
  })
}

export function useTogglePostLike() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) => feedApi.setPostLiked(id, liked),
    // Optimistic: flip immediately, roll back on failure.
    onMutate: ({ id, liked }) =>
      patchCachedPost(client, id, (post) => ({
        ...post,
        likedByMe: liked,
        likes: post.likes + (liked ? 1 : -1),
      })),
    onError: (_error, { id, liked }) =>
      patchCachedPost(client, id, (post) => ({ ...post, likedByMe: !liked, likes: post.likes + (liked ? -1 : 1) })),
  })
}

export function useToggleFollow() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, following }: { userId: string; following: boolean }) =>
      feedApi.setFollowing(userId, following),
    onSuccess: () => client.invalidateQueries({ queryKey: feedKeys.posts() }),
  })
}

export function useDeletePost() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => feedApi.deletePost(id),
    onSuccess: (_data, id) => {
      removeCachedPosts(client, (post) => post.id === id)
      client.removeQueries({ queryKey: feedKeys.detail(id) })
    },
  })
}

export function useHidePost() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => feedApi.hidePost(id),
    onSuccess: (_data, id) => removeCachedPosts(client, (post) => post.id === id),
  })
}

export function useBlockUser() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => feedApi.blockUser(userId),
    onSuccess: (_data, userId) => {
      removeCachedPosts(client, (post) => post.author.id === userId)
      client.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

export const useReportPost = () =>
  useMutation({
    mutationFn: ({ id, reasons }: { id: string; reasons: ReportReason[] }) => feedApi.reportPost(id, reasons),
  })

export function useAddComment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NewComment) => feedApi.addComment(input),
    onSuccess: (_comment, { postId }) => {
      patchCachedPost(client, postId, (post) => ({ ...post, commentsCount: post.commentsCount + 1 }))
      client.invalidateQueries({ queryKey: [...feedKeys.all, 'comments', postId] })
    },
  })
}

export function useDeleteComment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (comment: Comment) => feedApi.deleteComment(comment.id),
    onSuccess: (_data, comment) => {
      patchCachedPost(client, comment.postId, (post) => ({
        ...post,
        commentsCount: Math.max(0, post.commentsCount - 1),
      }))
      client.invalidateQueries({ queryKey: [...feedKeys.all, 'comments', comment.postId] })
    },
  })
}

export function useToggleCommentLike() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ comment, liked }: { comment: Comment; liked: boolean }) =>
      feedApi.setCommentLiked(comment.id, liked),
    onMutate: ({ comment, liked }) =>
      client.setQueriesData<Comment[]>({ queryKey: [...feedKeys.all, 'comments', comment.postId] }, (data) =>
        data?.map((item) =>
          item.id === comment.id ? { ...item, likedByMe: liked, likes: item.likes + (liked ? 1 : -1) } : item,
        ),
      ),
    onError: (_error, { comment }) =>
      client.invalidateQueries({ queryKey: [...feedKeys.all, 'comments', comment.postId] }),
  })
}

export const useReportComment = () => useMutation({ mutationFn: (id: string) => feedApi.reportComment(id) })
