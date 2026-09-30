/** Admin console routes — kept apart from the member app's `paths`. */
export const adminPaths = {
  login: '/admin/login',
  resetPassword: '/admin/reset-password',
  verifyOtp: '/admin/verify',
  newPassword: '/admin/new-password',
  overview: '/admin',
  users: '/admin/users',
  forums: '/admin/forums',
  projects: '/admin/projects',
  /** Moderation queue for a section: overview (all content), users, forums, projects. */
  moderation: (section = ':section') => `/admin/moderation/${section}`,
  events: '/admin/events',
  event: (id = ':eventId') => `/admin/events/${id}`,
  highlights: '/admin/highlights',
  highlight: (id = ':highlightId') => `/admin/highlights/${id}`,
  notifications: '/admin/notifications',
  logs: '/admin/logs',
  profile: '/admin/profile',
} as const
