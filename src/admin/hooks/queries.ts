import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import {  type ListQuery } from '../api/admin.service'
import {adminApi} from '@/lib/api'
import type {
  AdminForumRow,
  AdminProjectRow,
  AdminUserRow,
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

/* ------------------------------- Dashboards ----------------------------- */

export const useOverview = (range: DateRange) =>
  useQuery({ queryKey: adminKeys.overview(range), queryFn: () => adminApi.getOverviewStats() })

export const useSectionDashboard = (section: 'users' | 'forums' | 'projects', range: DateRange) =>
  useQuery({
    queryKey: adminKeys.section(section, range),
    queryFn: () => adminApi.getSectionDashboard(section, range),
  })

/* ------------------------------ Moderation ------------------------------ */

export const useReports = (section: ModerationSection, filter: ReportFilter, query: ListQuery) =>
  useQuery({
    queryKey: adminKeys.reports(section, filter, query),
    queryFn: () => adminApi.getReports(section, filter, query),
    placeholderData: keepPreviousData,
  })

export function useModerate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: ModerationAction }) =>
      adminApi.moderate(reportId, action),
    // Queues, dashboards and logs all reflect the new status.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/* -------------------------------- Records ------------------------------- */

type RecordKind = 'users' | 'forums' | 'projects'

const recordFetchers = {
  users: (query: ListQuery) => adminApi.getUsers(query),
  forums: (query: ListQuery) => adminApi.getForums(query),
  projects: (query: ListQuery) => adminApi.getProjects(query),
}

export function useRecords(kind: 'users', query: ListQuery): UseQueryResult<Page<AdminUserRow>>
export function useRecords(kind: 'forums', query: ListQuery): UseQueryResult<Page<AdminForumRow>>
export function useRecords(kind: 'projects', query: ListQuery): UseQueryResult<Page<AdminProjectRow>>
export function useRecords(
  kind: RecordKind,
  query: ListQuery,
): UseQueryResult<Page<AdminUserRow> | Page<AdminForumRow> | Page<AdminProjectRow>>
export function useRecords(kind: RecordKind, query: ListQuery) {
  return useQuery<Page<AdminUserRow> | Page<AdminForumRow> | Page<AdminProjectRow>>({
    queryKey: adminKeys.records(kind, query),
    queryFn: () => recordFetchers[kind](query),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateRecord(kind: RecordKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: RecordAction }) => adminApi.updateRecord(kind, id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

/* --------------------------------- Events ------------------------------- */

export const useAdminEvents = () => useQuery({ queryKey: adminKeys.events(), queryFn: adminApi.getEvents })

export const useAdminEvent = (id: string) =>
  useQuery({ queryKey: adminKeys.event(id), queryFn: () => adminApi.getEvent(id) })

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewEvent) => adminApi.createEvent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.events() }),
  })
}

/* ------------------------------- Highlights ----------------------------- */

export const useHighlightGroups = () =>
  useQuery({ queryKey: adminKeys.highlights(), queryFn: adminApi.getHighlightGroups })

export const useHighlightGroup = (id: string) =>
  useQuery({ queryKey: adminKeys.highlight(id), queryFn: () => adminApi.getHighlightGroup(id) })

export function useCreateHighlightGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewHighlightGroup) => adminApi.createHighlightGroup(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.highlights() }),
  })
}

export function useDeleteHighlightGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteHighlightGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.highlights() }),
  })
}

/* ------------------------- Notifications & logs ------------------------- */

export function useSendNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BroadcastNotification) => adminApi.sendNotification(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'logs'] }),
  })
}

export const useInbox = () => useQuery({ queryKey: adminKeys.inbox(), queryFn: adminApi.getInbox })

export function useMarkInboxRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminApi.markInboxRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.inbox() }),
  })
}

export const useLogs = (query: ListQuery) =>
  useQuery({
    queryKey: adminKeys.logs(query),
    queryFn: () => adminApi.getLogs(query),
    placeholderData: keepPreviousData,
  })
