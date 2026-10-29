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

/* -------------------------------- Records ------------------------------- */

export type RecordStatus = 'active' | 'restricted' | 'flagged' | 'warned' | 'suspended' | 'blocked' | 'removed'
