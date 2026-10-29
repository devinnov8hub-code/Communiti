import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminApi,
  type AdminCreateEventBody,
  type AdminCreateHighlightBody,
  type AdminCreateMaintenanceBody,
  type AdminListAuditLogsQuery,
  type AdminListForumsQuery,
  type AdminListProjectsQuery,
  type AdminListReportsQuery,
  type AdminListUserLogsQuery,
  type AdminResolveReportBody,
  type AdminSetForumStatusBody,
  type AdminListUsersQuery,
  type AdminSendBroadcastBody,
  type AdminSetUserStatusBody,
  type AdminUpdateSettingsBody,
  authApi,
  meApi,
  notificationsApi,
  type ChangePasswordBody,
  type UpdateMeBody,
  uploadFile,
} from '@/lib/api'
import type { DateRange, ModerationSection } from '../types'

export const adminKeys = {
  all: ['admin'] as const,
  overview: (range: DateRange) => [...adminKeys.all, 'overview', range] as const,
  inbox: () => [...adminKeys.all, 'inbox'] as const,
}

/* ------------------------------- Dashboards ----------------------------- */

/** Overview: KPI numbers, sign-up chart, newest pending reports and latest audit-log entries. */
export const useOverview = (range: DateRange) =>
  useQuery({
    queryKey: adminKeys.overview(range),
    queryFn: async () => {
      const [stats, activity, reports, logs] = await Promise.all([
        adminApi.getOverviewStats({ range }),
        adminApi.getUserActivityStats({ range }),
        adminApi.listReports({ status: 'pending', pageSize: 7 }),
        adminApi.listAuditLogs({ pageSize: 4 }),
      ])
      return { stats, activity, reports: reports.data, logs: logs.data }
    },
  })

/** Users dashboard: KPI cards, sign-up chart and pending reports about users. */
export const useUsersDashboard = (range: DateRange) =>
  useQuery({
    queryKey: [...adminKeys.all, 'users-dashboard', range],
    queryFn: async () => {
      const [stats, activity, reports] = await Promise.all([
        adminApi.getUserStats({ range }),
        adminApi.getUserActivityStats({ range }),
        adminApi.listReports({ status: 'pending', targetType: SECTION_TARGETS.users, pageSize: 7 }),
      ])
      return { stats, activity, reports: reports.data }
    },
  })

/** Users table (search + pages). Keeps the previous page on screen while the next one loads. */
export const useAdminUsers = (params: AdminListUsersQuery) =>
  useQuery({
    queryKey: [...adminKeys.all, 'users', params],
    queryFn: () => adminApi.listUsers(params),
    placeholderData: keepPreviousData,
  })

/** User details panel: profile, role form, report history. */
export const useAdminUser = (id: string) =>
  useQuery({ queryKey: [...adminKeys.all, 'user', id], queryFn: () => adminApi.getUser(id) })

/** A member's account logs (sign-ins, email changes, moderation), newest first. */
export const useUserLogs = (id: string, params: AdminListUserLogsQuery) =>
  useQuery({
    queryKey: [...adminKeys.all, 'user-logs', id, params],
    queryFn: () => adminApi.listUserLogs(id, params),
    placeholderData: keepPreviousData,
  })

/** Warn / restrict / suspend / block / reinstate a user. */
export function useSetUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminSetUserStatusBody }) => adminApi.setUserStatus(id, data),
    // Table, stat cards and audit log all change.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/** Forums dashboard: KPI cards, forum-post activity and pending forum reports. */
export const useForumsDashboard = (range: DateRange) =>
  useQuery({
    queryKey: [...adminKeys.all, 'forums-dashboard', range],
    queryFn: async () => {
      const [stats, activity, reports] = await Promise.all([
        adminApi.getForumStats({ range }),
        adminApi.getUserActivityStats({ range }),
        adminApi.listReports({ status: 'pending', targetType: 'forum', pageSize: 7 }),
      ])
      return { stats, activity, reports: reports.data }
    },
  })

/** Forums table (search + pages). */
export const useAdminForums = (params: AdminListForumsQuery) =>
  useQuery({
    queryKey: [...adminKeys.all, 'forums', params],
    queryFn: () => adminApi.listForums(params),
    placeholderData: keepPreviousData,
  })

/** Delete (hide from members) or restore a forum / project, with the typed reason. */
export function useSetContentRemoved(type: 'forum' | 'project') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, removed, note }: { id: string; removed: boolean; note?: string }) =>
      removed
        ? adminApi.removeContent(type, id, note ? { note } : null)
        : adminApi.restoreContent(type, id, note ? { note } : null),
    // Table, stat cards and audit log all change.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/** Warn / restrict / suspend / reinstate a forum or project. */
export function useSetGroupStatus(type: 'forum' | 'project') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminSetForumStatusBody }) =>
      type === 'forum' ? adminApi.setForumStatus(id, data) : adminApi.setProjectStatus(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/** Projects dashboard: KPI cards, status distribution and pending project reports. */
export const useProjectsDashboard = (range: DateRange) =>
  useQuery({
    queryKey: [...adminKeys.all, 'projects-dashboard', range],
    queryFn: async () => {
      const [stats, reports] = await Promise.all([
        adminApi.getProjectStats({ range }),
        adminApi.listReports({ status: 'pending', targetType: 'project', pageSize: 7 }),
      ])
      return { stats, reports: reports.data }
    },
  })

/** Projects table (search + pages). */
export const useAdminProjects = (params: AdminListProjectsQuery) =>
  useQuery({
    queryKey: [...adminKeys.all, 'projects', params],
    queryFn: () => adminApi.listProjects(params),
    placeholderData: keepPreviousData,
  })

/* ------------------------------ Moderation ------------------------------ */

/** What each moderation queue lists. Users covers people and what they post. */
export const SECTION_TARGETS: Record<ModerationSection, string | undefined> = {
  overview: undefined,
  users: 'user,post,comment,message',
  forums: 'forum',
  projects: 'project',
}

export const useReports = (section: ModerationSection, params: Omit<AdminListReportsQuery, 'targetType'>) =>
  useQuery({
    queryKey: [...adminKeys.all, 'reports', section, params],
    queryFn: () => adminApi.listReports({ ...params, targetType: SECTION_TARGETS[section] }),
    placeholderData: keepPreviousData,
  })

/** Review panel: the report with the reported content and the owner's history. */
export const useReport = (id: string) =>
  useQuery({ queryKey: [...adminKeys.all, 'report', id], queryFn: () => adminApi.getReport(id) })

/** Dismiss, remove content, warn / restrict / suspend / block (with the typed reason as `note`). */
export function useResolveReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminResolveReportBody }) => adminApi.resolveReport(id, data),
    // Queues, dashboards, user/forum/project status and logs all change.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/* --------------------------------- Events ------------------------------- */

/** Total / Active / Concluded / Upcoming cards. */
export const useEventStats = () =>
  useQuery({ queryKey: [...adminKeys.all, 'event-stats'], queryFn: () => adminApi.getEventStats() })

/** Events running now, coming up or finished; drafts included. */
export const useAdminEventList = (when: 'active' | 'upcoming' | 'concluded', q?: string) =>
  useQuery({
    queryKey: [...adminKeys.all, 'events', when, q],
    queryFn: () => adminApi.listEvents({ when, q, pageSize: 50 }),
    placeholderData: keepPreviousData,
  })

export const useAdminEvent = (id: string) =>
  useQuery({ queryKey: [...adminKeys.all, 'event', id], queryFn: () => adminApi.getEvent(id) })

/** Uploads the cover (if any), then creates and publishes the event. */
export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cover, ...event }: AdminCreateEventBody & { cover?: File }) => {
      const coverUrl = cover ? (await uploadFile(cover, 'event', {}, 'admin')).publicUrl : null
      return adminApi.createEvent({ ...event, coverUrl })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/* ------------------------------- Highlights ----------------------------- */

export const useHighlights = (q?: string) =>
  useQuery({
    queryKey: [...adminKeys.all, 'highlights', q],
    queryFn: () => adminApi.listHighlights({ q, pageSize: 50 }),
    placeholderData: keepPreviousData,
  })

export const useHighlight = (id: string) =>
  useQuery({ queryKey: [...adminKeys.all, 'highlight', id], queryFn: () => adminApi.getHighlight(id) })

/** Events to attach highlights to, past ones included ("Use an existing event"). */
export const useEventOptions = (q?: string) =>
  useQuery({
    queryKey: [...adminKeys.all, 'event-options', q],
    queryFn: () => adminApi.listEvents({ q, pageSize: 50 }),
    placeholderData: keepPreviousData,
  })

/** Uploads the photos, then publishes the album. */
export function useCreateHighlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ images, ...album }: Omit<AdminCreateHighlightBody, 'mediaIds'> & { images: File[] }) => {
      const uploaded = await Promise.all(images.map((file) => uploadFile(file, 'highlight', {}, 'admin')))
      return adminApi.createHighlight({ ...album, mediaIds: uploaded.map((item) => item.mediaId), publish: true })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

export function useDeleteHighlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteHighlight(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/* ------------------------- Notifications & logs ------------------------- */

/** Email every member of a platform, or only some users / forums / projects. */
export function useSendBroadcast() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminSendBroadcastBody) => adminApi.sendBroadcast(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

const ADMIN = { scope: 'admin' } as const

/** The admin's own notifications (bell in the top bar). */
export const useInbox = () =>
  useQuery({
    queryKey: adminKeys.inbox(),
    queryFn: () => notificationsApi.listNotifications({ limit: 20 }, ADMIN),
  })

export function useMarkInboxRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markNotificationsRead({ all: true }, ADMIN),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.inbox() }),
  })
}

/** Logs page: every admin action, searchable, newest first. */
export const useAuditLogs = (params: AdminListAuditLogsQuery) =>
  useQuery({
    queryKey: [...adminKeys.all, 'audit-logs', params],
    queryFn: () => adminApi.listAuditLogs(params),
    placeholderData: keepPreviousData,
  })

/* -------------------------------- Settings ------------------------------ */

export const usePlatformSettings = () =>
  useQuery({ queryKey: [...adminKeys.all, 'settings'], queryFn: () => adminApi.getSettings() })

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUpdateSettingsBody) => adminApi.updateSettings(data),
    onSuccess: (settings) => queryClient.setQueryData([...adminKeys.all, 'settings'], settings),
  })
}

/** Scheduled and running maintenance windows. */
export const useUpcomingMaintenance = () =>
  useQuery({
    queryKey: [...adminKeys.all, 'maintenance'],
    queryFn: () => adminApi.listMaintenance({ state: 'upcoming', pageSize: 5 }),
  })

/** Schedule maintenance; members are emailed the message. */
export function useScheduleMaintenance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminCreateMaintenanceBody) => adminApi.createMaintenance(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

export function useCancelMaintenance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteMaintenance(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/* --------------------------------- Profile ------------------------------ */

/** The signed-in admin's own account (phone etc. aren't in the sign-in response). */
export const useAdminMe = () => useQuery({ queryKey: [...adminKeys.all, 'me'], queryFn: () => meApi.getMe(ADMIN) })

/** Save name, phone and photo; uploads a new photo first. `avatar: null` removes it. */
export function useUpdateAdminProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ avatar, ...fields }: Pick<UpdateMeBody, 'fullName' | 'phone'> & { avatar?: File | null }) => {
      const avatarUrl =
        avatar === undefined ? undefined : avatar && (await uploadFile(avatar, 'avatar', {}, 'admin')).publicUrl
      return meApi.updateMe({ ...fields, ...(avatarUrl !== undefined && { avatarUrl }) }, ADMIN)
    },
    onSuccess: (me) => queryClient.setQueryData([...adminKeys.all, 'me'], me),
  })
}

export const useChangeAdminPassword = () =>
  useMutation({ mutationFn: (data: ChangePasswordBody) => authApi.changePassword(data, ADMIN) })
