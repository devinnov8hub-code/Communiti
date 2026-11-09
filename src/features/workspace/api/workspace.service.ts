import { apiRequest, USE_MOCK_API } from '@/lib/api/legacy'
import { mockWorkspaceApi } from './workspace.mock'
import type { EvaluationScores, EvaluationSummary, EvaluationTarget, LedgerEntry, NewTask, ProjectTask } from '../types'

/** TEMPORARY — the workspace tabs not connected yet (Expert, Ledger, Tasks). See README for the endpoint list. */
export interface WorkspaceApi {
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

const base = (projectId: string) => `/projects/${projectId}`

const httpWorkspaceApi: WorkspaceApi = {
  getEvaluations: (id) => apiRequest(`${base(id)}/evaluations`),
  createEvaluation: (id, input) => apiRequest(`${base(id)}/evaluations`, { method: 'POST', body: input }),

  getLedger: (id) => apiRequest(`${base(id)}/ledger`),

  getTasks: (id) => apiRequest(`${base(id)}/tasks`),
  createTask: (id, input) => apiRequest(`${base(id)}/tasks`, { method: 'POST', body: input }),
  updateTask: (id, taskId, patch) => apiRequest(`${base(id)}/tasks/${taskId}`, { method: 'PATCH', body: patch }),
  deleteTask: (id, taskId) => apiRequest(`${base(id)}/tasks/${taskId}`, { method: 'DELETE' }),
}

export const workspaceApi: WorkspaceApi = USE_MOCK_API ? mockWorkspaceApi : httpWorkspaceApi
