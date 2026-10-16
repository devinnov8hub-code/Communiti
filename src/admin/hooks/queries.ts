import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { adminApi as sampleApi, type ListQuery } from '../api/admin.service'
import { adminApi, type AdminListUsersQuery, type AdminSetUserStatusBody } from '@/lib/api'
import type {
  AdminForumRow,
  AdminProjectRow,
  BroadcastNotification,
  DateRange,
  ModerationAction,
  ModerationSection,
  NewEvent,
  NewHighlightGroup,
  Page,
  RecordAction,
  ReportFilter,
} from '../types'

export const adminKeys = {
  all: ['admin'] as const,
  overview: (range: DateRange) => [...adminKeys.all, 'overview', range] as const,
  section: (section: string, range: DateRange) => [...adminKeys.all, 'section', section, range] as const,
  reports: (section: ModerationSection, filter: ReportFilter, query: ListQuery) =>
    [...adminKeys.all, 'reports', section, filter, query] as const,
  records: (kind: string, query: ListQuery) => [...adminKeys.all, 'records', kind, query] as const,
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

export const useSectionDashboard = (section: 'forums' | 'projects', range: DateRange) =>
  useQuery({
    queryKey: adminKeys.section(section, range),
    queryFn: () => sampleApi.getSectionDashboard(section, range),
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

/* -------------------------------- Records ------------------------------- */

type RecordKind = 'forums' | 'projects'

const recordFetchers = {
  forums: (query: ListQuery) => sampleApi.getForums(query),
  projects: (query: ListQuery) => sampleApi.getProjects(query),
}

export function useRecords(kind: 'forums', query: ListQuery): UseQueryResult<Page<AdminForumRow>>
export function useRecords(kind: 'projects', query: ListQuery): UseQueryResult<Page<AdminProjectRow>>
export function useRecords(
  kind: RecordKind,
  query: ListQuery,
): UseQueryResult<Page<AdminForumRow> | Page<AdminProjectRow>>
export function useRecords(kind: RecordKind, query: ListQuery) {
  return useQuery<Page<AdminForumRow> | Page<AdminProjectRow>>({
    queryKey: adminKeys.records(kind, query),
    queryFn: () => recordFetchers[kind](query),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateRecord(kind: RecordKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: RecordAction }) => sampleApi.updateRecord(kind, id, action),
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
