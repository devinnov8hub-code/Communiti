import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi as sampleApi, type ListQuery } from '../api/admin.service'
import {
  adminApi,
  type AdminListForumsQuery,
  type AdminListProjectsQuery,
  type AdminListUsersQuery,
  type AdminSetUserStatusBody,
} from '@/lib/api'
import type {
  BroadcastNotification,
  DateRange,
  ModerationAction,
  ModerationSection,
  NewEvent,
  NewHighlightGroup,
  ReportFilter,
} from '../types'

export const adminKeys = {
  all: ['admin'] as const,
  overview: (range: DateRange) => [...adminKeys.all, 'overview', range] as const,
  reports: (section: ModerationSection, filter: ReportFilter, query: ListQuery) =>
    [...adminKeys.all, 'reports', section, filter, query] as const,
  events: () => [...adminKeys.all, 'events'] as const,
  event: (id: string) => [...adminKeys.all, 'events', id] as const,
  highlights: () => [...adminKeys.all, 'highlights'] as const,
  highlight: (id: string) => [...adminKeys.all, 'highlights', id] as const,
  inbox: () => [...adminKeys.all, 'inbox'] as const,
  logs: (query: ListQuery) => [...adminKeys.all, 'logs', query] as const,
}

// `adminApi` (from '@/lib/api') = the real backend. `sampleApi` = screens not connected yet;
// it and src/admin/api are deleted once every admin screen uses `adminApi`.

/* ------------------------------- Dashboards ----------------------------- */

/** Overview: KPI numbers, sign-up chart, newest pending reports and latest audit-log entries. */
export const useOverview = (range: DateRange) =>
  useQuery({
    queryKey: adminKeys.overview(range),
    queryFn: async () => {
      const [stats, activity, reports, logs] = await Promise.all([
        adminApi.getOverviewStats(),
        adminApi.getUserActivityStats({ period: range }),
        adminApi.listReports({ status: 'pending', pageSize: 7 }),
        adminApi.listAuditLogs({ pageSize: 4 }),
      ])
      return { stats, activity, reports: reports.data, logs: logs.data }
    },
  })

/** Users dashboard: KPI numbers, sign-up chart and pending reports about users. */
export const useUsersDashboard = (range: DateRange) =>
  useQuery({
    queryKey: [...adminKeys.all, 'users-dashboard', range],
    queryFn: async () => {
      const [stats, activity, reports] = await Promise.all([
        adminApi.getOverviewStats(),
        adminApi.getUserActivityStats({ period: range }),
        adminApi.listReports({ status: 'pending', targetType: 'user', pageSize: 7 }),
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

/** Warn / restrict / suspend / block / reinstate a user. */
export function useSetUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminSetUserStatusBody }) => adminApi.setUserStatus(id, data),
    // Table, stat cards and audit log all change.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/**
 * Forums dashboard: total forums, pending forum reports and post activity.
 * The backend has no forum-only post stats yet, so posts are platform-wide.
 */
export const useForumsDashboard = (range: DateRange) =>
  useQuery({
    queryKey: [...adminKeys.all, 'forums-dashboard', range],
    queryFn: async () => {
      const [stats, activity, reports] = await Promise.all([
        adminApi.getOverviewStats(),
        adminApi.getUserActivityStats({ period: range }),
        adminApi.listReports({ status: 'pending', targetType: 'forum', pageSize: 7 }),
      ])
      return { stats, activity, reports: reports.data, pendingReports: reports.total }
    },
  })

/** Forums table (search + pages). */
export const useAdminForums = (params: AdminListForumsQuery) =>
  useQuery({
    queryKey: [...adminKeys.all, 'forums', params],
    queryFn: () => adminApi.listForums(params),
    placeholderData: keepPreviousData,
  })

/** Hide a forum or project from members, or bring it back. */
export function useSetContentRemoved(type: 'forum' | 'project') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, removed }: { id: string; removed: boolean }) =>
      removed ? adminApi.removeContent(type, id, null) : adminApi.restoreContent(type, id, null),
    // Table, stat cards and audit log all change.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/**
 * Projects dashboard: total projects, pending project reports and the status breakdown.
 * The backend has no project-status stats yet, so the breakdown counts the newest
 * 100 projects (the largest page it allows); `sampled` says when there are more.
 */
export const useProjectsDashboard = () =>
  useQuery({
    queryKey: [...adminKeys.all, 'projects-dashboard'],
    queryFn: async () => {
      const [stats, reports, newest] = await Promise.all([
        adminApi.getOverviewStats(),
        adminApi.listReports({ status: 'pending', targetType: 'project', pageSize: 7 }),
        adminApi.listProjects({ pageSize: 100 }),
      ])
      return {
        stats,
        reports: reports.data,
        projects: newest.data,
        sampled: newest.total > newest.data.length,
      }
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

export const useReports = (section: ModerationSection, filter: ReportFilter, query: ListQuery) =>
  useQuery({
    queryKey: adminKeys.reports(section, filter, query),
    queryFn: () => sampleApi.getReports(section, filter, query),
    placeholderData: keepPreviousData,
  })

export function useModerate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: ModerationAction }) =>
      sampleApi.moderate(reportId, action),
    // Queues, dashboards and logs all reflect the new status.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/* --------------------------------- Events ------------------------------- */

export const useAdminEvents = () => useQuery({ queryKey: adminKeys.events(), queryFn: sampleApi.getEvents })

export const useAdminEvent = (id: string) =>
  useQuery({ queryKey: adminKeys.event(id), queryFn: () => sampleApi.getEvent(id) })

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewEvent) => sampleApi.createEvent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sampleApi.deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.events() }),
  })
}

/* ------------------------------- Highlights ----------------------------- */

export const useHighlightGroups = () =>
  useQuery({ queryKey: adminKeys.highlights(), queryFn: sampleApi.getHighlightGroups })

export const useHighlightGroup = (id: string) =>
  useQuery({ queryKey: adminKeys.highlight(id), queryFn: () => sampleApi.getHighlightGroup(id) })

export function useCreateHighlightGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewHighlightGroup) => sampleApi.createHighlightGroup(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.highlights() }),
  })
}

export function useDeleteHighlightGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sampleApi.deleteHighlightGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.highlights() }),
  })
}

/* ------------------------- Notifications & logs ------------------------- */

export function useSendNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BroadcastNotification) => sampleApi.sendNotification(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'logs'] }),
  })
}

export const useInbox = () => useQuery({ queryKey: adminKeys.inbox(), queryFn: sampleApi.getInbox })

export function useMarkInboxRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sampleApi.markInboxRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.inbox() }),
  })
}

export const useLogs = (query: ListQuery) =>
  useQuery({
    queryKey: adminKeys.logs(query),
    queryFn: () => sampleApi.getLogs(query),
    placeholderData: keepPreviousData,
  })
