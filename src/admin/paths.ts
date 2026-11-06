import { isAdminHost } from '@/app/host'

/** URL prefix of the admin console: the domain root on the admin subdomain, else /admin. */
const base = isAdminHost ? '' : '/admin'

/** Admin console routes — kept apart from the member app's `paths`. */
export const adminPaths = {
  login: `${base}/login`,
  resetPassword: `${base}/reset-password`,
  verifyOtp: `${base}/verify`,
  newPassword: `${base}/new-password`,
  overview: base || '/',
  users: `${base}/users`,
  /** One member's account logs ("user logs"). */
  userLogs: (id = ':userId') => `${base}/users/${id}/logs`,
  forums: `${base}/forums`,
  projects: `${base}/projects`,
  /** Moderation queue for a section: overview (all content), users, forums, projects. */
  moderation: (section = ':section') => `${base}/moderation/${section}`,
  events: `${base}/events`,
  event: (id = ':eventId') => `${base}/events/${id}`,
  highlights: `${base}/highlights`,
  highlight: (id = ':highlightId') => `${base}/highlights/${id}`,
  notifications: `${base}/notifications`,
  logs: `${base}/logs`,
  settings: `${base}/settings`,
  profile: `${base}/profile`,
} as const
