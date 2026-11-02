import type { CreateReportBody, ListTrendingForumsResponse } from '@/lib/api'

/** What the composer offers; forum and project posts are created from those screens. */
export type Audience = 'everyone' | 'followers'

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

/** The value the backend expects for each reason shown in the dialog. */
export const REPORT_REASON_VALUES: Record<ReportReason, CreateReportBody['reason']> = {
  'Spam or misleading content': 'spam',
  'Harassment or bullying': 'harassment',
  'Hate or abusive content': 'hate',
  'Intellectual property violation': 'intellectual_property',
  'Violence or harmful content': 'violence',
  'False or misleading information': 'misinformation',
  'Scam or fraudulent activity': 'scam',
}

/** A card in the right bar: "Trending in Forums", "Trending in Agriculture topics". */
export interface TrendingGroup {
  id: string
  title: string
  forums: ListTrendingForumsResponse['data']
}

export type SearchScope = 'posts' | 'people' | 'events' | 'highlights' | 'topic'
