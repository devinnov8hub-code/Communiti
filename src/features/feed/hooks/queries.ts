import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  exploreApi,
  postsApi,
  reportsApi,
  searchApi,
  topicsApi,
  uploadFile,
  usersApi,
  type Comment,
  type CreateReportBody,
  type Post,
  type PresignUploadBody,
} from '@/lib/api'
import {
  REPORT_REASON_VALUES,
  type CommentSort,
  type FeedTab,
  type NewComment,
  type NewPost,
  type ReportReason,
  type TrendingGroup,
} from '../types'

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

// Lists are cached as plain arrays (the `data` of each page) so patchCachedPost can update them in place.
export const useFeed = (tab: FeedTab) =>
  useQuery({ queryKey: feedKeys.list(tab), queryFn: () => postsApi.getFeed({ tab }).then((page) => page.data) })

export const useUserPosts = (userId: string) =>
  useQuery({
    queryKey: feedKeys.user(userId),
    queryFn: () => postsApi.listUserPosts(userId).then((page) => page.data),
    enabled: Boolean(userId),
  })

export const usePost = (id: string) => useQuery({ queryKey: feedKeys.detail(id), queryFn: () => postsApi.getPost(id) })

export const useComments = (postId: string, sort: CommentSort) =>
  useQuery({
    queryKey: feedKeys.comments(postId, sort),
    queryFn: () =>
      postsApi.listPostComments(postId, { sort }).then((page) => page.data.filter((comment) => !comment.isDeleted)),
  })

/** The backend needs at least 2 characters, even when searching inside a topic. */
export const MIN_SEARCH_LENGTH = 2

export const useSearchPosts = (query: string, topic?: string) =>
  useQuery({
    queryKey: feedKeys.search(query, topic),
    queryFn: () =>
      searchApi.search({ q: query, type: 'posts', topicId: topic, limit: 30 }).then((results) => results.posts),
    enabled: query.length >= MIN_SEARCH_LENGTH,
  })

/** "Trending in Forums", then the same list for this week's top topic. */
async function getTrending() {
  const [forums, topics] = await Promise.all([
    searchApi.listTrendingForums({ limit: 2 }),
    searchApi.listTrendingTopics({ limit: 1 }),
  ])
  const groups: TrendingGroup[] = [{ id: 'forums', title: 'Trending in Forums', forums: forums.data }]
  const [topic] = topics.data
  if (topic) {
    const inTopic = await searchApi.listTrendingForums({ topicId: topic.id, limit: 2 })
    groups.push({ id: topic.id, title: `Trending in ${topic.name} topics`, forums: inTopic.data })
  }
  return groups.filter((group) => group.forums.length > 0)
}

export const useTrending = () =>
  useQuery({ queryKey: feedKeys.trending(), queryFn: getTrending, staleTime: 5 * 60_000 })

export const useEvents = () =>
  useQuery({
    queryKey: feedKeys.events(),
    queryFn: () => exploreApi.listEvents({ when: 'upcoming', limit: 3 }).then((page) => page.data),
    staleTime: 5 * 60_000,
  })

export const useSearchTopics = () =>
  useQuery({
    queryKey: feedKeys.topics(),
    queryFn: () => topicsApi.listTopics().then((page) => page.data),
    staleTime: Infinity,
  })

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

/** Files are uploaded first; posts and comments only carry the resulting ids. */
export const uploadAttachments = async (files: File[], purpose: PresignUploadBody['purpose']) => {
  const uploaded = await Promise.all(files.map((file) => uploadFile(file, purpose)))
  return uploaded.map((file) => file.mediaId)
}

export function useCreatePost() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ content, audience, attachments, forumId }: NewPost) =>
      postsApi.createPost({
        body: content,
        audience: forumId ? 'forum' : audience,
        forumId,
        mediaIds: await uploadAttachments(attachments, 'post'),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: feedKeys.posts() }),
  })
}

export function useTogglePostLike() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? postsApi.likePost(id) : postsApi.unlikePost(id),
    // Optimistic: flip immediately, roll back on failure.
    onMutate: ({ id, liked }) =>
      patchCachedPost(client, id, (post) => ({
        ...post,
        likedByMe: liked,
        likeCount: post.likeCount + (liked ? 1 : -1),
      })),
    onError: (_error, { id, liked }) =>
      patchCachedPost(client, id, (post) => ({
        ...post,
        likedByMe: !liked,
        likeCount: post.likeCount + (liked ? -1 : 1),
      })),
  })
}

export function useToggleFollow() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, following }: { userId: string; following: boolean }) =>
      following ? usersApi.followUser(userId) : usersApi.unfollowUser(userId),
    onSuccess: () => client.invalidateQueries({ queryKey: feedKeys.posts() }),
  })
}

export function useDeletePost() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => postsApi.deletePost(id),
    onSuccess: (_data, id) => {
      removeCachedPosts(client, (post) => post.id === id)
      client.removeQueries({ queryKey: feedKeys.detail(id) })
    },
  })
}

export function useHidePost() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => postsApi.notInterestedPost(id),
    onSuccess: (_data, id) => removeCachedPosts(client, (post) => post.id === id),
  })
}

export function useBlockUser() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => usersApi.blockUser(userId),
    onSuccess: (_data, userId) => {
      removeCachedPosts(client, (post) => post.author.id === userId)
      client.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

/** Report a post, user, project… */
export const useReport = (targetType: CreateReportBody['targetType']) =>
  useMutation({
    // The dialog allows several reasons but a report carries one; the rest go in `details`.
    mutationFn: ({ id, reasons: [reason, ...others] }: { id: string; reasons: ReportReason[] }) =>
      reportsApi.createReport({
        targetType,
        targetId: id,
        reason: REPORT_REASON_VALUES[reason],
        details: others.length > 0 ? `Also reported as: ${others.join(', ')}` : undefined,
      }),
  })

export function useAddComment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ postId, content, attachments }: NewComment) =>
      postsApi.createPostComment(postId, {
        body: content,
        mediaIds: await uploadAttachments(attachments, 'comment'),
      }),
    onSuccess: (_comment, { postId }) => {
      patchCachedPost(client, postId, (post) => ({ ...post, commentCount: post.commentCount + 1 }))
      client.invalidateQueries({ queryKey: [...feedKeys.all, 'comments', postId] })
    },
  })
}

export function useDeleteComment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (comment: Comment) => postsApi.deleteComment(comment.id),
    onSuccess: (_data, comment) => {
      patchCachedPost(client, comment.postId, (post) => ({
        ...post,
        commentCount: Math.max(0, post.commentCount - 1),
      }))
      client.invalidateQueries({ queryKey: [...feedKeys.all, 'comments', comment.postId] })
    },
  })
}

export function useToggleCommentLike() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ comment, liked }: { comment: Comment; liked: boolean }) =>
      liked ? postsApi.likeComment(comment.id) : postsApi.unlikeComment(comment.id),
    onMutate: ({ comment, liked }) =>
      client.setQueriesData<Comment[]>({ queryKey: [...feedKeys.all, 'comments', comment.postId] }, (data) =>
        data?.map((item) =>
          item.id === comment.id ? { ...item, likedByMe: liked, likeCount: item.likeCount + (liked ? 1 : -1) } : item,
        ),
      ),
    onError: (_error, { comment }) =>
      client.invalidateQueries({ queryKey: [...feedKeys.all, 'comments', comment.postId] }),
  })
}

// The comment menu reports straight away, with no reason dialog.
export const useReportComment = () =>
  useMutation({
    mutationFn: (id: string) => reportsApi.createReport({ targetType: 'comment', targetId: id, reason: 'other' }),
  })
