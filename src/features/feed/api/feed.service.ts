import { apiRequest, USE_MOCK_API } from '@/lib/api/legacy'
import type {
  Author,
  Comment,
  CommentSort,
  CommunityEvent,
  FeedTab,
  NewComment,
  NewPost,
  Post,
  ReportReason,
  SearchTopic,
  TrendingGroup,
} from '../types'
import { mockFeedApi } from './feed.mock'

/** Feed / posts API contract. See README for the endpoint list. */
export interface FeedApi {
  getFeed(tab: FeedTab): Promise<Post[]>
  /** Posts by one user; 'me' for the current user. */
  getUserPosts(userId: string): Promise<Post[]>
  getPost(id: string): Promise<Post>
  createPost(input: NewPost): Promise<Post>
  deletePost(id: string): Promise<void>
  setPostLiked(id: string, liked: boolean): Promise<Post>
  /** "Not interested" */
  hidePost(id: string): Promise<void>
  reportPost(id: string, reasons: ReportReason[]): Promise<void>
  blockUser(userId: string): Promise<void>
  unblockUser(userId: string): Promise<void>
  getBlockedUsers(): Promise<Author[]>
  setFollowing(userId: string, following: boolean): Promise<void>

  getComments(postId: string, sort: CommentSort): Promise<Comment[]>
  addComment(input: NewComment): Promise<Comment>
  deleteComment(id: string): Promise<void>
  setCommentLiked(id: string, liked: boolean): Promise<void>
  reportComment(id: string): Promise<void>

  getTrending(): Promise<TrendingGroup[]>
  getEvents(): Promise<CommunityEvent[]>
  getSearchTopics(): Promise<SearchTopic[]>
  searchPosts(params: { query: string; topic?: string }): Promise<Post[]>
}

/** Posts with attachments are sent as multipart form data. */
function toFormData(fields: Record<string, string>, files: File[]) {
  const form = new FormData()
  Object.entries(fields).forEach(([key, value]) => form.append(key, value))
  files.forEach((file) => form.append('attachments', file))
  return form
}

const httpFeedApi: FeedApi = {
  getFeed: (tab) => apiRequest(`/feed?tab=${tab}`),
  getUserPosts: (userId) => apiRequest(`/users/${userId}/posts`),
  getPost: (id) => apiRequest(`/posts/${id}`),
  createPost: ({ content, audience, attachments }) =>
    apiRequest('/posts', { method: 'POST', body: toFormData({ content, audience }, attachments) }),
  deletePost: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
  setPostLiked: (id, liked) => apiRequest(`/posts/${id}/like`, { method: liked ? 'PUT' : 'DELETE' }),
  hidePost: (id) => apiRequest(`/posts/${id}/hide`, { method: 'POST' }),
  reportPost: (id, reasons) => apiRequest(`/posts/${id}/reports`, { method: 'POST', body: { reasons } }),
  blockUser: (userId) => apiRequest(`/users/${userId}/block`, { method: 'PUT' }),
  unblockUser: (userId) => apiRequest(`/users/${userId}/block`, { method: 'DELETE' }),
  getBlockedUsers: () => apiRequest('/users/me/blocked'),
  setFollowing: (userId, following) => apiRequest(`/users/${userId}/follow`, { method: following ? 'PUT' : 'DELETE' }),

  getComments: (postId, sort) => apiRequest(`/posts/${postId}/comments?sort=${sort}`),
  addComment: ({ postId, content, attachments }) =>
    apiRequest(`/posts/${postId}/comments`, { method: 'POST', body: toFormData({ content }, attachments) }),
  deleteComment: (id) => apiRequest(`/comments/${id}`, { method: 'DELETE' }),
  setCommentLiked: (id, liked) => apiRequest(`/comments/${id}/like`, { method: liked ? 'PUT' : 'DELETE' }),
  reportComment: (id) => apiRequest(`/comments/${id}/reports`, { method: 'POST' }),

  getTrending: () => apiRequest('/trending'),
  getEvents: () => apiRequest('/events?upcoming=true'),
  getSearchTopics: () => apiRequest('/topics'),
  searchPosts: ({ query, topic }) =>
    apiRequest(`/search/posts?${new URLSearchParams({ q: query, ...(topic && { topic }) })}`),
}

export const feedApi: FeedApi = USE_MOCK_API ? mockFeedApi : httpFeedApi
