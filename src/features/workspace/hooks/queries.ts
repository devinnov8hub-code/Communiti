import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { projectKeys } from '@/features/projects/hooks/queries'
import { projectsApi, uploadFile, workspaceApi as api, type ProjectNotificationSettings } from '@/lib/api'
import { workspaceApi } from '../api/workspace.service'
import {
  toJoinRequest,
  toPrototype,
  toPrototypeVersion,
  toResearchDoc,
  toWorkspace,
  toWorkspaceMember,
} from '../mappers'
import { textToRichText } from '../richText'
import type { EvaluationScores, EvaluationTarget, NewTask, ProjectTask } from '../types'

export const workspaceKeys = {
  all: (projectId: string) => ['workspace', projectId] as const,
  prefs: (projectId: string) => [...workspaceKeys.all(projectId), 'prefs'] as const,
  members: (projectId: string) => [...workspaceKeys.all(projectId), 'members'] as const,
  requests: (projectId: string) => [...workspaceKeys.all(projectId), 'requests'] as const,
  contracts: (projectId: string) => [...workspaceKeys.all(projectId), 'contracts'] as const,
  research: (projectId: string) => [...workspaceKeys.all(projectId), 'research'] as const,
  prototypes: (projectId: string) => [...workspaceKeys.all(projectId), 'prototypes'] as const,
  versions: (projectId: string, prototypeId: string) =>
    [...workspaceKeys.all(projectId), 'versions', prototypeId] as const,
  evaluations: (projectId: string) => [...workspaceKeys.all(projectId), 'evaluations'] as const,
  ledger: (projectId: string) => [...workspaceKeys.all(projectId), 'ledger'] as const,
  tasks: (projectId: string) => [...workspaceKeys.all(projectId), 'tasks'] as const,
}

/* ------------------------------- Project -------------------------------- */

/** The project (shared with the edit form's cache), shaped for the workspace. */
export function useWorkspace(projectId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsApi.getProject(projectId),
    select: (project) => toWorkspace(project, user?.id),
    enabled: Boolean(projectId),
    // Keep checking while a join request is waiting for an admin.
    refetchInterval: (query) =>
      !query.state.data?.myRole && query.state.data?.joinRequestStatus === 'pending' ? 5000 : false,
  })
}

/** Refreshes the project everywhere it is shown (workspace, Projects lists). */
function useInvalidateProject(projectId: string) {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: projectKeys.all }),
      client.invalidateQueries({ queryKey: workspaceKeys.all(projectId) }),
    ])
}

/** Sent after the member agrees to the collaboration terms. */
export function useRequestToJoin(projectId: string) {
  const invalidate = useInvalidateProject(projectId)
  return useMutation({ mutationFn: () => projectsApi.requestToJoinProject(projectId, {}), onSuccess: invalidate })
}

export function useLeaveProject(projectId: string) {
  const { user } = useAuth()
  const invalidate = useInvalidateProject(projectId)
  return useMutation({
    mutationFn: () => projectsApi.removeProjectMember(projectId, user?.id ?? ''),
    onSuccess: invalidate,
  })
}

export const useNotificationPrefs = (projectId: string) =>
  useQuery({ queryKey: workspaceKeys.prefs(projectId), queryFn: () => api.getNotificationSettings(projectId) })

export function useUpdateNotificationPrefs(projectId: string) {
  const queryClient = useQueryClient()
  const key = workspaceKeys.prefs(projectId)
  return useMutation({
    mutationFn: (prefs: ProjectNotificationSettings) => api.setNotificationSettings(projectId, prefs),
    // Toggles flip immediately; roll back if the save fails.
    onMutate: async (prefs) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ProjectNotificationSettings>(key)
      queryClient.setQueryData(key, prefs)
      return { previous }
    },
    onError: (_error, _prefs, context) => queryClient.setQueryData(key, context?.previous),
    onSuccess: (prefs) => queryClient.setQueryData(key, prefs),
  })
}

/* ------------------------------- Members -------------------------------- */

export function useMembers(projectId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: workspaceKeys.members(projectId),
    queryFn: () => projectsApi.listProjectMembers(projectId).then((page) => page.data),
    select: (members) => members.map((member) => toWorkspaceMember(member, user?.id)),
  })
}

/** Pending requests (owner and admins only). */
export const useJoinRequests = (projectId: string, enabled: boolean) =>
  useQuery({
    queryKey: workspaceKeys.requests(projectId),
    queryFn: () => projectsApi.listProjectJoinRequests(projectId).then((page) => page.data.map(toJoinRequest)),
    enabled,
  })

export function useRemoveMember(projectId: string) {
  const invalidate = useInvalidateProject(projectId)
  return useMutation({
    mutationFn: (memberId: string) => projectsApi.removeProjectMember(projectId, memberId),
    onSuccess: invalidate,
  })
}

export function useRespondToJoinRequest(projectId: string) {
  const invalidate = useInvalidateProject(projectId)
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      accept
        ? projectsApi.acceptJoinRequest(projectId, requestId, {})
        : projectsApi.declineJoinRequest(projectId, requestId, {}),
    onSuccess: invalidate,
  })
}

/* ------------------------------- Contracts ------------------------------ */

/** Contract files uploaded by the project's admins (download links are valid for an hour). */
export const useContracts = (projectId: string) =>
  useQuery({
    queryKey: workspaceKeys.contracts(projectId),
    queryFn: () => api.listContracts(projectId).then((page) => page.data),
    staleTime: 30 * 60_000,
  })

/* ------------------------------- Research ------------------------------- */

/** Newest first, a page at a time (also feeds the Expert tab's document picker). */
export const useResearch = (projectId: string) =>
  useInfiniteQuery({
    queryKey: workspaceKeys.research(projectId),
    queryFn: ({ pageParam }) => api.listResearch(projectId, { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.data.map(toResearchDoc)),
  })

function useInvalidate(key: readonly unknown[]) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: key })
}

/** A document written in the app (saved as rich text). */
export function useCreateResearch(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.research(projectId))
  const invalidateLedger = useInvalidate(workspaceKeys.ledger(projectId))
  return useMutation({
    mutationFn: ({ title, body }: { title: string; body: string }) =>
      api.createResearch(projectId, { kind: 'written', title, content: textToRichText(body) }).then(toResearchDoc),
    onSuccess: () => Promise.all([invalidate(), invalidateLedger()]),
  })
}

/** Author or admin. */
export function useDeleteResearch(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.research(projectId))
  return useMutation({
    mutationFn: (docId: string) => api.deleteResearch(projectId, docId),
    onSuccess: invalidate,
  })
}

export function useCommentOnResearch(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.research(projectId))
  return useMutation({
    mutationFn: ({ docId, text }: { docId: string; text: string }) =>
      api.createWorkspaceComment(projectId, { targetType: 'research_doc', targetId: docId, body: text }),
    onSuccess: invalidate,
  })
}

/* ------------------------------ Prototypes ------------------------------ */

export function usePrototypes(projectId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: workspaceKeys.prototypes(projectId),
    queryFn: () => api.listPrototypes(projectId).then((page) => page.data),
    select: (prototypes) => prototypes.map((prototype) => toPrototype(prototype, user?.id)),
  })
}

/** The thumbnail has to be public (`coverUrl`), so it goes up with the public `project` purpose. */
export function useCreatePrototype(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.prototypes(projectId))
  return useMutation({
    mutationFn: async ({ name, thumbnail }: { name: string; thumbnail?: File }) =>
      api.createPrototype(projectId, {
        name,
        coverUrl: thumbnail ? (await uploadFile(thumbnail, 'project')).publicUrl : null,
      }),
    onSuccess: invalidate,
  })
}

/** Project admins only. */
export function useDeletePrototype(projectId: string) {
  const invalidate = useInvalidate(workspaceKeys.prototypes(projectId))
  return useMutation({
    mutationFn: (prototypeId: string) => api.deletePrototype(projectId, prototypeId),
    onSuccess: invalidate,
  })
}

/** A prototype and its versions, newest first (file links are signed for an hour). */
export function usePrototype(projectId: string, prototypeId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: workspaceKeys.versions(projectId, prototypeId ?? ''),
    queryFn: () => api.getPrototype(projectId, prototypeId!),
    select: ({ versions, ...prototype }) => ({
      prototype: toPrototype(prototype, user?.id),
      versions: versions.map((version) => toPrototypeVersion(version, prototype.id, user?.id)),
    }),
    enabled: Boolean(prototypeId),
    staleTime: 30 * 60_000,
  })
}

export function useCreateVersion(projectId: string, prototypeId: string) {
  const { user } = useAuth()
  const invalidate = useInvalidate(workspaceKeys.versions(projectId, prototypeId))
  const invalidateList = useInvalidate(workspaceKeys.prototypes(projectId))
  const invalidateLedger = useInvalidate(workspaceKeys.ledger(projectId))
  return useMutation({
    mutationFn: async ({ name, file }: { name: string; file: File }) => {
      const { mediaId } = await uploadFile(file, 'prototype')
      const version = await api.createPrototypeVersion(projectId, prototypeId, {
        versionLabel: name,
        mediaIds: [mediaId],
      })
      return toPrototypeVersion(version, prototypeId, user?.id)
    },
    onSuccess: () => Promise.all([invalidate(), invalidateList(), invalidateLedger()]),
  })
}

export function useCommentOnVersion(projectId: string, prototypeId: string) {
  const invalidate = useInvalidate(workspaceKeys.versions(projectId, prototypeId))
  return useMutation({
    mutationFn: ({ versionId, text }: { versionId: string; text: string }) =>
      api.createWorkspaceComment(projectId, { targetType: 'prototype_version', targetId: versionId, body: text }),
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
