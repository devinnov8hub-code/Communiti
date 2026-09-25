export interface Author {
  id: string
  name: string
  avatarUrl?: string
  /** Community role label shown in orange under the name, e.g. "Expert". */
  role: string
}

export type Audience = 'everyone' | 'followers'

export interface Post {
  id: string
  author: Author
  content: string
  imageUrl?: string
  createdAt: string
  audience: Audience
  likes: number
  likedByMe: boolean
  commentsCount: number
  views: number
  /** Whether the current user follows the author. */
  followingAuthor: boolean
  isMine: boolean
}

export interface Comment {
  id: string
  postId: string
  author: Author
  content: string
  imageUrl?: string
  createdAt: string
  likes: number
  likedByMe: boolean
  repliesCount: number
  isMine: boolean
}

export type FeedTab = 'for-you' | 'following'
export type CommentSort = 'latest' | 'popular'

export interface NewPost {
  content: string
  audience: Audience
  attachments: File[]
}

export interface NewComment {
  postId: string
  content: string
  attachments: File[]
}

export const REPORT_REASONS = [
  'Spam or misleading content',
  'Harassment or bullying',
  'Hate or abusive content',
  'Intellectual property violation',
  'Violence or harmful content',
  'False or misleading information',
  'Scam or fraudulent activity',
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export interface TrendingTopic {
  id: string
  title: string
  postsCount: number
  coverUrl?: string
}

export interface TrendingGroup {
  id: string
  title: string
  href: string
  topics: TrendingTopic[]
}

export interface CommunityEvent {
  id: string
  category: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  location: string
  imageUrl?: string
}

export type SearchTopicTone = 'green' | 'blue' | 'orange'

export interface SearchTopic {
  id: string
  name: string
  description: string
  iconUrl: string
  tone: SearchTopicTone
}

export type SearchScope = 'posts' | 'people' | 'events' | 'highlights' | 'topic'
