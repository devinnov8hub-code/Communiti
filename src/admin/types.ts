import type { ExploreEvent, Highlight } from '@/features/explore/types'

/* --------------------------------- Auth --------------------------------- */

export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatarUrl?: string
}

export interface AdminSession {
  token: string
  admin: AdminUser
}

/* ------------------------------- Dashboard ------------------------------ */

export type DateRange = '7d' | '30d' | '12m'
export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '12m', label: 'Last 12 months' },
]

export type StatTone = 'orange' | 'green' | 'indigo' | 'violet' | 'red' | 'grey' | 'blue'

export interface StatCardData {
  id: string
  label: string
  caption: string
  value: number
  /** Percentage change vs the previous period; omitted when the backend has nothing to compare. */
  change?: number
  tone: StatTone
}

export interface ActivityPoint {
  label: string
  value: number
}

export interface DistributionSlice {
  label: string
  value: number
  tone: 'blue' | 'orange' | 'grey' | 'green'
}

/* ------------------------------ Moderation ------------------------------ */

/** Which area a moderation queue belongs to; `overview` lists every kind of content. */
export type ModerationSection = 'overview' | 'users' | 'forums' | 'projects'
export const MODERATION_SECTIONS: ModerationSection[] = ['overview', 'users', 'forums', 'projects']

export type ReportStatus = 'pending' | 'banned' | 'suspended' | 'dismissed' | 'resolved'
export type ReportFilter = 'all' | 'pending' | 'reviewed' | 'dismissed'
export type ReportedKind = 'post' | 'forum' | 'project' | 'user'

export interface ReportedPost {
  kind: 'post' | 'user'
  author: { name: string; role: string; avatarUrl?: string }
  postedAt: string
  text: string
  likes: number
  comments: number
}

export interface ReportedGroup {
  kind: 'forum' | 'project'
  title: string
  owner?: string
  membersCount: number
  members: { id: string; name: string; avatarUrl?: string }[]
  focus: { label: string; tone: 'success' | 'info' | 'warning' }[]
  about: string
}

export type ReportedContent = ReportedPost | ReportedGroup

export const isGroupContent = (content: ReportedContent): content is ReportedGroup =>
  content.kind === 'forum' || content.kind === 'project'

export interface Report {
  id: string
  /** "#2341" */
  number: number
  section: Exclude<ModerationSection, 'overview'>
  /** Name / title shown in the queue. */
  subject: string
  type: 'Post' | 'Project' | 'Forum' | 'User'
  reason: string
  status: ReportStatus
  reportsCount: number
  previousReports: number
  previousWarnings: number
  accountStatus: 'Active' | 'Suspended' | 'Blocked'
  content: ReportedContent
  createdAt: string
}

export type ModerationAction =
  'dismiss' | 'remove-content' | 'warn' | 'suspend-user' | 'block-user' | 'suspend-group' | 'delete-group'

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/* -------------------------------- Records ------------------------------- */

export type RecordStatus = 'active' | 'restricted' | 'flagged' | 'warned' | 'suspended' | 'blocked' | 'removed'

export interface AdminProjectRow {
  id: string
  name: string
  creator: string
  members: number
  reports: number
  createdAt: string
  status: RecordStatus
}

export type RecordAction = 'activate' | 'restrict' | 'warn' | 'suspend'

/* ------------------------------- Dashboards ----------------------------- */

export interface SectionDashboard {
  stats: StatCardData[]
  activity: ActivityPoint[]
  distribution?: DistributionSlice[]
  queue: Report[]
}

/* ---------------------------- Events & content --------------------------- */

export type AdminEvent = ExploreEvent

export interface NewEvent {
  title: string
  category: string
  startsAt: string
  endsAt: string
  location?: string
  about: string
  organizer: string
  cover?: File
}

export interface HighlightGroup {
  id: string
  title: string
  cover: Highlight
  images: Highlight[]
}

export interface NewHighlightGroup {
  title?: string
  eventId?: string
  images: File[]
}

/* ------------------------------ Notifications --------------------------- */

export type NotificationAudience = 'all' | 'users' | 'forums' | 'projects'

export interface BroadcastNotification {
  audience: NotificationAudience
  targetId?: string
  title: string
  ids?: string
  body: string
}

export interface AdminInboxItem {
  id: string
  title: string
  message: string
  at: string
  read: boolean
}

/* ---------------------------------- Logs -------------------------------- */

export interface AdminLog {
  id: string
  action: string
  at: string
  message: string
}
