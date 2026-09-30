import { apiRequest, USE_MOCK_API } from '@/lib/api/client'
import { local } from '@/lib/storage'
import type {
  AdminEvent,
  AdminForumRow,
  AdminInboxItem,
  AdminLog,
  AdminProjectRow,
  AdminSession,
  AdminUser,
  AdminUserRow,
  BroadcastNotification,
  DateRange,
  HighlightGroup,
  ModerationAction,
  ModerationSection,
  NewEvent,
  NewHighlightGroup,
  OverviewDashboard,
  Page,
  RecordAction,
  Report,
  ReportFilter,
  SectionDashboard,
} from '../types'
import { mockAdminApi } from './admin.mock'

export const ADMIN_SESSION_KEY = 'communiti-admin-session'

export interface ListQuery {
  page: number
  search?: string
}

/** Admin API contract (separate admin token). See README for the endpoint list. */
export interface AdminApi {
  login(email: string, password: string): Promise<AdminSession>
  requestPasswordReset(email: string): Promise<void>
  verifyResetCode(email: string, code: string): Promise<{ resetToken: string }>
  setNewPassword(resetToken: string, password: string): Promise<void>
  updateProfile(input: Omit<AdminUser, 'id' | 'avatarUrl'> & { avatar?: File | null }): Promise<AdminUser>
  changePassword(oldPassword: string, newPassword: string): Promise<void>

  getOverview(range: DateRange): Promise<OverviewDashboard>
  getSectionDashboard(section: 'users' | 'forums' | 'projects', range: DateRange): Promise<SectionDashboard>

  getReports(section: ModerationSection, filter: ReportFilter, query: ListQuery): Promise<Page<Report>>
  moderate(reportId: string, action: ModerationAction): Promise<Report>

  getUsers(query: ListQuery): Promise<Page<AdminUserRow>>
  getForums(query: ListQuery): Promise<Page<AdminForumRow>>
  getProjects(query: ListQuery): Promise<Page<AdminProjectRow>>
  updateRecord(kind: 'users' | 'forums' | 'projects', id: string, action: RecordAction): Promise<void>

  getEvents(): Promise<AdminEvent[]>
  getEvent(id: string): Promise<AdminEvent>
  createEvent(input: NewEvent): Promise<AdminEvent>
  deleteEvent(id: string): Promise<void>

  getHighlightGroups(): Promise<HighlightGroup[]>
  getHighlightGroup(id: string): Promise<HighlightGroup>
  createHighlightGroup(input: NewHighlightGroup): Promise<HighlightGroup>
  deleteHighlightGroup(id: string): Promise<void>

  sendNotification(input: BroadcastNotification): Promise<void>
  getInbox(): Promise<AdminInboxItem[]>
  markInboxRead(): Promise<void>

  getLogs(query: ListQuery): Promise<Page<AdminLog>>
}

/** Admin endpoints authenticate with the admin token, not the member session. */
function adminRequest<T>(path: string, init: Parameters<typeof apiRequest>[1] = {}) {
  const token = local.get<AdminSession>(ADMIN_SESSION_KEY)?.token
  return apiRequest<T>(`/admin${path}`, {
    ...init,
    headers: { ...(token && { Authorization: `Bearer ${token}` }), ...init.headers },
  })
}

const qs = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString()

function toForm(fields: Record<string, string | File | File[] | null | undefined>) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue
    if (Array.isArray(value)) value.forEach((file) => form.append(`${key}[]`, file))
    else form.append(key, value ?? '')
  }
  return form
}

const httpAdminApi: AdminApi = {
  login: (email, password) => apiRequest('/admin/auth/login', { method: 'POST', body: { email, password } }),
  requestPasswordReset: (email) => apiRequest('/admin/auth/password-reset', { method: 'POST', body: { email } }),
  verifyResetCode: (email, code) =>
    apiRequest('/admin/auth/password-reset/verify', { method: 'POST', body: { email, code } }),
  setNewPassword: (resetToken, password) =>
    apiRequest('/admin/auth/password-reset/complete', { method: 'POST', body: { resetToken, password } }),
  updateProfile: ({ avatar, ...fields }) =>
    adminRequest('/me', { method: 'PATCH', body: toForm({ ...fields, phone: fields.phone ?? '', avatar }) }),
  changePassword: (oldPassword, newPassword) =>
    adminRequest('/me/password', { method: 'PUT', body: { oldPassword, newPassword } }),

  getOverview: (range) => adminRequest(`/dashboard?${qs({ range })}`),
  getSectionDashboard: (section, range) => adminRequest(`/dashboard/${section}?${qs({ range })}`),

  getReports: (section, filter, { page, search }) =>
    adminRequest(`/reports?${qs({ section, status: filter, page, q: search })}`),
  moderate: (reportId, action) => adminRequest(`/reports/${reportId}/actions`, { method: 'POST', body: { action } }),

  getUsers: ({ page, search }) => adminRequest(`/users?${qs({ page, q: search })}`),
  getForums: ({ page, search }) => adminRequest(`/forums?${qs({ page, q: search })}`),
  getProjects: ({ page, search }) => adminRequest(`/projects?${qs({ page, q: search })}`),
  updateRecord: (kind, id, action) => adminRequest(`/${kind}/${id}/status`, { method: 'PATCH', body: { action } }),

  getEvents: () => adminRequest('/events'),
  getEvent: (id) => adminRequest(`/events/${id}`),
  createEvent: ({ cover, ...fields }) =>
    adminRequest('/events', { method: 'POST', body: toForm({ ...fields, location: fields.location, cover }) }),
  deleteEvent: (id) => adminRequest(`/events/${id}`, { method: 'DELETE' }),

  getHighlightGroups: () => adminRequest('/highlights'),
  getHighlightGroup: (id) => adminRequest(`/highlights/${id}`),
  createHighlightGroup: ({ images, title, eventId }) =>
    adminRequest('/highlights', { method: 'POST', body: toForm({ title, eventId, images }) }),
  deleteHighlightGroup: (id) => adminRequest(`/highlights/${id}`, { method: 'DELETE' }),

  sendNotification: (input) => adminRequest('/notifications/broadcast', { method: 'POST', body: input }),
  getInbox: () => adminRequest('/inbox'),
  markInboxRead: () => adminRequest('/inbox/read-all', { method: 'POST' }),

  getLogs: ({ page, search }) => adminRequest(`/logs?${qs({ page, q: search })}`),
}

export const adminApi: AdminApi = USE_MOCK_API ? mockAdminApi : httpAdminApi
