import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from '@/features/projects/hooks/queries'
import { workspaceApi } from '../api/workspace.service'
import type {
  EvaluationScores,
  EvaluationTarget,
  NewTask,
  ProjectNotificationPrefs,
  ProjectTask,
  ProjectWorkspace,
} from '../types'

export const workspaceKeys = {
  all: (projectId: string) => ['workspace', projectId] as const,
  detail: (projectId: string) => [...workspaceKeys.all(projectId), 'detail'] as const,
  prefs: (projectId: string) => [...workspaceKeys.all(projectId), 'prefs'] as const,
  members: (projectId: string) => [...workspaceKeys.all(projectId), 'members'] as const,
  requests: (projectId: string) => [...workspaceKeys.all(projectId), 'requests'] as const,
  research: (projectId: string) => [...workspaceKeys.all(projectId), 'research'] as const,
  prototypes: (projectId: string) => [...workspaceKeys.all(projectId), 'prototypes'] as const,
  versions: (projectId: string, prototypeId: string) =>
    [...workspaceKeys.all(projectId), 'versions', prototypeId] as const,
  evaluations: (projectId: string) => [...workspaceKeys.all(projectId), 'evaluations'] as const,
  ledger: (projectId: string) => [...workspaceKeys.all(projectId), 'ledger'] as const,
  tasks: (projectId: string) => [...workspaceKeys.all(projectId), 'tasks'] as const,
}

/* ------------------------------- Project -------------------------------- */

export const useWorkspace = (projectId: string) =>
  useQuery({
    queryKey: workspaceKeys.detail(projectId),
    queryFn: () => workspaceApi.getWorkspace(projectId),
    enabled: Boolean(projectId),
    // Keep checking while a join request is waiting for an admin.
    refetchInterval: (query) => (query.state.data?.membership === 'pending' ? 5000 : false),
  })

function useSetWorkspace(projectId: string) {
  const queryClient = useQueryClient()
  return (workspace: ProjectWorkspace) => {
    queryClient.setQueryData(workspaceKeys.detail(projectId), workspace)
    queryClient.invalidateQueries({ queryKey: projectKeys.all })
  }
}

export function useRequestToJoin(projectId: string) {
  const setWorkspace = useSetWorkspace(projectId)
  return useMutation({ mutationFn: () => workspaceApi.requestToJoin(projectId), onSuccess: setWorkspace })
}

export function useLeaveProject(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => workspaceApi.leaveProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export const useReportProject = (projectId: string) =>
  useMutation({ mutationFn: (reasons: string[]) => workspaceApi.reportProject(projectId, reasons) })

export const useNotificationPrefs = (projectId: string) =>
  useQuery({ queryKey: workspaceKeys.prefs(projectId), queryFn: () => workspaceApi.getNotificationPrefs(projectId) })

export function useUpdateNotificationPrefs(projectId: string) {
  const queryClient = useQueryClient()
  const key = workspaceKeys.prefs(projectId)
  return useMutation({
    mutationFn: (prefs: ProjectNotificationPrefs) => workspaceApi.updateNotificationPrefs(projectId, prefs),
    // Toggles flip immediately; roll back if the save fails.
    onMutate: async (prefs) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ProjectNotificationPrefs>(key)
      queryClient.setQueryData(key, prefs)
      return { previous }
    },
    onError: (_error, _prefs, context) => queryClient.setQueryData(key, context?.previous),
  })
}

/* ------------------------------- Members -------------------------------- */

export const useMembers = (projectId: string) =>
  useQuery({ queryKey: workspaceKeys.members(projectId), queryFn: () => workspaceApi.getMembers(projectId) })

export const useJoinRequests = (projectId: string, enabled: boolean) =>
  useQuery({
    queryKey: workspaceKeys.requests(projectId),
    queryFn: () => workspaceApi.getJoinRequests(projectId),
    enabled,
  })

function useInvalidateMembers(projectId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(projectId) }),
      queryClient.invalidateQueries({ queryKey: workspaceKeys.requests(projectId) }),
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(projectId) }),
    ])
}

export function useRemoveMember(projectId: string) {
  const invalidate = useInvalidateMembers(projectId)
  return useMutation({
    mutationFn: (memberId: string) => workspaceApi.removeMember(projectId, memberId),
    onSuccess: invalidate,
  })
}

export function useRespondToJoinRequest(projectId: string) {
  const invalidate = useInvalidateMembers(projectId)
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      workspaceApi.respondToJoinRequest(projectId, requestId, accept),
    onSuccess: invalidate,
  })
}

export function useSetAcceptRequests(projectId: string) {
  const setWorkspace = useSetWorkspace(projectId)
  return useMutation({
    mutationFn: (accept: boolean) => workspaceApi.setAcceptRequests(projectId, accept),
    onSuccess: setWorkspace,
  })
}

/* ------------------------------- Research ------------------------------- */

export const useResearch = (projectId: string) =>
  useQuery({ queryKey: workspaceKeys.research(projectId), queryFn: () => workspaceApi.getResearch(projectId) })

function useInvalidate(key: readonly unknown[]) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: key })
}

export function useCreateResearch(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.research(projectId))
  const invalidateLedger = useInvalidate(workspaceKeys.ledger(projectId))
  return useMutation({
    mutationFn: (input: { title: string; body: string }) => workspaceApi.createResearch(projectId, input),
    onSuccess: () => Promise.all([invalidate(), invalidateLedger()]),
  })
}

export function useDeleteResearch(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.research(projectId))
  return useMutation({
    mutationFn: (docId: string) => workspaceApi.deleteResearch(projectId, docId),
    onSuccess: invalidate,
  })
}

export function useCommentOnResearch(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.research(projectId))
  return useMutation({
    mutationFn: ({ docId, text }: { docId: string; text: string }) =>
      workspaceApi.commentOnResearch(projectId, docId, text),
    onSuccess: invalidate,
  })
}

/* ------------------------------ Prototypes ------------------------------ */

export const usePrototypes = (projectId: string) =>
  useQuery({ queryKey: workspaceKeys.prototypes(projectId), queryFn: () => workspaceApi.getPrototypes(projectId) })

export function useCreatePrototype(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.prototypes(projectId))
  return useMutation({
    mutationFn: (input: { name: string; thumbnail?: File }) => workspaceApi.createPrototype(projectId, input),
    onSuccess: invalidate,
  })
}

export function useDeletePrototype(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.prototypes(projectId))
  return useMutation({
    mutationFn: (prototypeId: string) => workspaceApi.deletePrototype(projectId, prototypeId),
    onSuccess: invalidate,
  })
}

export const useVersions = (projectId: string, prototypeId: string | undefined) =>
  useQuery({
    queryKey: workspaceKeys.versions(projectId, prototypeId ?? ''),
    queryFn: () => workspaceApi.getVersions(projectId, prototypeId!),
    enabled: Boolean(prototypeId),
  })

export function useCreateVersion(projectId: string, prototypeId: string) {
  const invalidate = useInvalidate(workspaceKeys.versions(projectId, prototypeId))
  const invalidateLedger = useInvalidate(workspaceKeys.ledger(projectId))
  return useMutation({
    mutationFn: (input: { name: string; file: File }) => workspaceApi.createVersion(projectId, prototypeId, input),
    onSuccess: () => Promise.all([invalidate(), invalidateLedger()]),
  })
}

export function useCommentOnVersion(projectId: string, prototypeId: string) {
  const invalidate = useInvalidate(workspaceKeys.versions(projectId, prototypeId))
  return useMutation({
    mutationFn: ({ versionId, text }: { versionId: string; text: string }) =>
      workspaceApi.commentOnVersion(projectId, versionId, text),
    onSuccess: invalidate,
  })
}

/* ------------------------------ Evaluations ----------------------------- */

export const useEvaluations = (projectId: string) =>
  useQuery({ queryKey: workspaceKeys.evaluations(projectId), queryFn: () => workspaceApi.getEvaluations(projectId) })

export function useCreateEvaluation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { target: EvaluationTarget; scores: EvaluationScores; comment: string }) =>
      workspaceApi.createEvaluation(projectId, input),
    onSuccess: (summary) => {
      queryClient.setQueryData(workspaceKeys.evaluations(projectId), summary)
      queryClient.invalidateQueries({ queryKey: workspaceKeys.ledger(projectId) })
    },
  })
}

/* -------------------------------- Ledger -------------------------------- */

export const useLedger = (projectId: string) =>
  useQuery({ queryKey: workspaceKeys.ledger(projectId), queryFn: () => workspaceApi.getLedger(projectId) })

/* --------------------------------- Tasks -------------------------------- */

export const useTasks = (projectId: string) =>
  useQuery({ queryKey: workspaceKeys.tasks(projectId), queryFn: () => workspaceApi.getTasks(projectId) })

export function useCreateTask(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.tasks(projectId))
  return useMutation({
    mutationFn: (input: NewTask) => workspaceApi.createTask(projectId, input),
    onSuccess: invalidate,
  })
}

export function useToggleTask(projectId: string) {
  const queryClient = useQueryClient()
  const key = workspaceKeys.tasks(projectId)
  return useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      workspaceApi.updateTask(projectId, taskId, { completed }),
    // Tick the box immediately; roll back on failure.
    onMutate: async ({ taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ProjectTask[]>(key)
      queryClient.setQueryData<ProjectTask[]>(key, (tasks) =>
        tasks?.map((task) => (task.id === taskId ? { ...task, completed } : task)),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteTask(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.tasks(projectId))
  return useMutation({
    mutationFn: (taskId: string) => workspaceApi.deleteTask(projectId, taskId),
    onSuccess: invalidate,
  })
}
