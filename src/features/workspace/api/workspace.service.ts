import { apiRequest, USE_MOCK_API } from '@/lib/api/client'
import { mockWorkspaceApi } from './workspace.mock'
import type {
  EvaluationScores,
  EvaluationSummary,
  EvaluationTarget,
  JoinRequest,
  LedgerEntry,
  NewTask,
  ProjectNotificationPrefs,
  ProjectTask,
  ProjectWorkspace,
  Prototype,
  PrototypeVersion,
  ResearchDoc,
  WorkspaceMember,
} from '../types'

/** Project workspace API contract. See README for the endpoint list. */
export interface WorkspaceApi {
  getWorkspace(projectId: string): Promise<ProjectWorkspace>
  /** Accepts the project terms and asks to join. */
  requestToJoin(projectId: string): Promise<ProjectWorkspace>
  leaveProject(projectId: string): Promise<void>
  reportProject(projectId: string, reasons: string[]): Promise<void>

  getNotificationPrefs(projectId: string): Promise<ProjectNotificationPrefs>
  updateNotificationPrefs(projectId: string, prefs: ProjectNotificationPrefs): Promise<ProjectNotificationPrefs>

  getMembers(projectId: string): Promise<WorkspaceMember[]>
  removeMember(projectId: string, memberId: string): Promise<void>
  getJoinRequests(projectId: string): Promise<JoinRequest[]>
  respondToJoinRequest(projectId: string, requestId: string, accept: boolean): Promise<void>
  setAcceptRequests(projectId: string, accept: boolean): Promise<ProjectWorkspace>

  getResearch(projectId: string): Promise<ResearchDoc[]>
  createResearch(projectId: string, input: { title: string; body: string }): Promise<ResearchDoc>
  deleteResearch(projectId: string, docId: string): Promise<void>
  commentOnResearch(projectId: string, docId: string, text: string): Promise<ResearchDoc>

  getPrototypes(projectId: string): Promise<Prototype[]>
  createPrototype(projectId: string, input: { name: string; thumbnail?: File }): Promise<Prototype>
  deletePrototype(projectId: string, prototypeId: string): Promise<void>
  getVersions(projectId: string, prototypeId: string): Promise<PrototypeVersion[]>
  createVersion(projectId: string, prototypeId: string, input: { name: string; file: File }): Promise<PrototypeVersion>
  commentOnVersion(projectId: string, versionId: string, text: string): Promise<PrototypeVersion>

  getEvaluations(projectId: string): Promise<EvaluationSummary>
  createEvaluation(
    projectId: string,
    input: { target: EvaluationTarget; scores: EvaluationScores; comment: string },
  ): Promise<EvaluationSummary>

  getLedger(projectId: string): Promise<LedgerEntry[]>

  getTasks(projectId: string): Promise<ProjectTask[]>
  createTask(projectId: string, input: NewTask): Promise<ProjectTask>
  updateTask(projectId: string, taskId: string, patch: { completed: boolean }): Promise<ProjectTask>
  deleteTask(projectId: string, taskId: string): Promise<void>
}

const form = (fields: Record<string, string | File | undefined>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) data.append(key, value)
  return data
}

const base = (projectId: string) => `/projects/${projectId}`

const httpWorkspaceApi: WorkspaceApi = {
  getWorkspace: (id) => apiRequest(base(id)),
  requestToJoin: (id) => apiRequest(`${base(id)}/join-requests`, { method: 'POST', body: { acceptedTerms: true } }),
  leaveProject: (id) => apiRequest(`${base(id)}/membership`, { method: 'DELETE' }),
  reportProject: (id, reasons) => apiRequest(`${base(id)}/reports`, { method: 'POST', body: { reasons } }),

  getNotificationPrefs: (id) => apiRequest(`${base(id)}/notification-preferences`),
  updateNotificationPrefs: (id, prefs) =>
    apiRequest(`${base(id)}/notification-preferences`, { method: 'PUT', body: prefs }),

  getMembers: (id) => apiRequest(`${base(id)}/members`),
  removeMember: (id, memberId) => apiRequest(`${base(id)}/members/${memberId}`, { method: 'DELETE' }),
  getJoinRequests: (id) => apiRequest(`${base(id)}/join-requests`),
  respondToJoinRequest: (id, requestId, accept) =>
    apiRequest(`${base(id)}/join-requests/${requestId}`, {
      method: 'PATCH',
      body: { status: accept ? 'accepted' : 'declined' },
    }),
  setAcceptRequests: (id, accept) => apiRequest(base(id), { method: 'PATCH', body: { acceptRequests: accept } }),

  getResearch: (id) => apiRequest(`${base(id)}/research`),
  createResearch: (id, input) => apiRequest(`${base(id)}/research`, { method: 'POST', body: input }),
  deleteResearch: (id, docId) => apiRequest(`${base(id)}/research/${docId}`, { method: 'DELETE' }),
  commentOnResearch: (id, docId, text) =>
    apiRequest(`${base(id)}/research/${docId}/comments`, { method: 'POST', body: { text } }),

  getPrototypes: (id) => apiRequest(`${base(id)}/prototypes`),
  createPrototype: (id, input) =>
    apiRequest(`${base(id)}/prototypes`, {
      method: 'POST',
      body: form({ name: input.name, thumbnail: input.thumbnail }),
    }),
  deletePrototype: (id, prototypeId) => apiRequest(`${base(id)}/prototypes/${prototypeId}`, { method: 'DELETE' }),
  getVersions: (id, prototypeId) => apiRequest(`${base(id)}/prototypes/${prototypeId}/versions`),
  createVersion: (id, prototypeId, input) =>
    apiRequest(`${base(id)}/prototypes/${prototypeId}/versions`, {
      method: 'POST',
      body: form({ name: input.name, file: input.file }),
    }),
  commentOnVersion: (id, versionId, text) =>
    apiRequest(`${base(id)}/versions/${versionId}/comments`, { method: 'POST', body: { text } }),

  getEvaluations: (id) => apiRequest(`${base(id)}/evaluations`),
  createEvaluation: (id, input) => apiRequest(`${base(id)}/evaluations`, { method: 'POST', body: input }),

  getLedger: (id) => apiRequest(`${base(id)}/ledger`),

  getTasks: (id) => apiRequest(`${base(id)}/tasks`),
  createTask: (id, input) => apiRequest(`${base(id)}/tasks`, { method: 'POST', body: input }),
  updateTask: (id, taskId, patch) => apiRequest(`${base(id)}/tasks/${taskId}`, { method: 'PATCH', body: patch }),
  deleteTask: (id, taskId) => apiRequest(`${base(id)}/tasks/${taskId}`, { method: 'DELETE' }),
}

export const workspaceApi: WorkspaceApi = USE_MOCK_API ? mockWorkspaceApi : httpWorkspaceApi
