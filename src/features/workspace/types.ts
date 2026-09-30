import type { ProjectRole, ProjectStatus } from '@/features/projects/types'

export const WORKSPACE_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'research', label: 'Research' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'expert', label: 'Expert' },
  { value: 'ledger', label: 'Ledger' },
  { value: 'contract', label: 'Contract' },
  { value: 'tasks', label: 'Tasks' },
] as const
export type WorkspaceTab = (typeof WORKSPACE_TABS)[number]['value']

/** The current user's relationship to a project. */
export type Membership = 'none' | 'pending' | 'member' | 'admin'

export interface WorkspaceMember {
  id: string
  name: string
  avatarUrl?: string
  /** "Expert", "Engineer", … */
  role: string
  isYou?: boolean
}

export interface ContractTerm {
  title: string
  body: string
}

export interface ProjectContract {
  createdAt: string
  updatedAt: string
  intro: string
  terms: ContractTerm[]
}

/** Everything the workspace header and Overview tab need. */
export interface ProjectWorkspace {
  id: string
  title: string
  owner: { id: string; name: string }
  status: ProjectStatus
  membersCount: number
  /** A few members for the avatar stack. */
  members: WorkspaceMember[]
  videoUrl?: string
  videoPosterUrl?: string
  pitch: string
  problem: string
  solution: string
  impact: string
  rolesNeeded: ProjectRole[]
  membership: Membership
  /** Admins can pause incoming join requests. */
  acceptRequests: boolean
  /** Project group chat, when the user can see it. */
  conversationId?: string
  contract: ProjectContract
}

export interface JoinRequest {
  id: string
  user: WorkspaceMember
}

export interface ProjectNotificationPrefs {
  projectUpdates: boolean
  teamActivity: boolean
  tasksAssigned: boolean
  deadlines: boolean
}

export interface ResearchDoc {
  id: string
  title: string
  body: string
  thumbnailUrl?: string
  updatedBy: string
  updatedAt: string
  commentsCount: number
}

export interface Prototype {
  id: string
  name: string
  thumbnailUrl?: string
  createdAt: string
  artisans: WorkspaceMember[]
}

export interface PrototypeVersion {
  id: string
  prototypeId: string
  name: string
  /** Grid thumbnail; falls back to the full image. */
  thumbnailUrl?: string
  imageUrl?: string
  editedBy: WorkspaceMember
  updatedAt: string
  commentsCount: number
}

export const EVALUATION_CRITERIA = [
  { key: 'feasibility', label: 'Feasibility' },
  { key: 'sustainability', label: 'Sustainability' },
  { key: 'novelty', label: 'Novelty' },
] as const
export type EvaluationCriterion = (typeof EVALUATION_CRITERIA)[number]['key']
export type EvaluationScores = Record<EvaluationCriterion, number>

/** What an expert is reviewing: a research document or a prototype version. */
export type EvaluationTarget =
  | { kind: 'research'; id: string; label: string }
  | { kind: 'prototype'; id: string; label: string; versionId: string; versionLabel: string }

export interface Evaluation {
  id: string
  author: { id: string; name: string; avatarUrl?: string }
  comment: string
  target: EvaluationTarget
  scores: EvaluationScores
  createdAt: string
}

export interface EvaluationSummary {
  /** Average of all scores, out of 100. */
  score: number
  evaluations: Evaluation[]
}

export type LedgerKind = 'chat' | 'research' | 'review' | 'prototype' | 'team'

export interface LedgerEntry {
  id: string
  kind: LedgerKind
  actor: string
  action: string
  /** Quoted message, file name or version. */
  detail?: string
  at: string
}

export interface ProjectTask {
  id: string
  title: string
  description: string
  /** ISO date, YYYY-MM-DD */
  dueDate: string
  completed: boolean
  assignees: WorkspaceMember[]
}

export interface NewTask {
  title: string
  description: string
  assigneeId: string
  dueDate: string
}
