import type { ProjectStatus } from '@/features/projects/types'

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
  /** Their title in the project, else their CommUniti role: "Expert", "Engineer", … */
  role: string
  isYou?: boolean
  isOwner?: boolean
}

/** Everything the workspace header and Overview tab need (from `GET /projects/:id`). */
export interface ProjectWorkspace {
  id: string
  title: string
  ownerName: string
  status: ProjectStatus
  membersCount: number
  /** A few members for the avatar stack. */
  members: WorkspaceMember[]
  coverUrl?: string
  videoUrl?: string
  pitch: string
  problem: string
  solution: string
  membership: Membership
  /** The owner can't leave (ownership has to be transferred first). */
  isOwner: boolean
  /** Owners, admins and contributors can add work (viewers can only read and comment). */
  canContribute: boolean
  /** Project group chat, for members. */
  conversationId?: string
}

export interface JoinRequest {
  id: string
  user: WorkspaceMember
  message?: string
}

export interface ResearchDoc {
  id: string
  title: string
  /** Written documents' text (empty for uploads). */
  body: string
  /** Uploaded documents' file (the link is signed and expires after a while). */
  file?: { url: string; name: string }
  thumbnailUrl?: string
  authorId: string
  updatedBy: string
  updatedAt: string
  commentsCount: number
}

export interface Prototype {
  id: string
  name: string
  thumbnailUrl?: string
  createdAt: string
  createdBy: WorkspaceMember
  versionCount: number
}

export interface PrototypeVersion {
  id: string
  prototypeId: string
  /** The backend's `versionLabel`, e.g. "Version 2.1". */
  name: string
  /** Set when the uploaded file is an image (shown in the grid and preview). */
  imageUrl?: string
  /** The uploaded file (signed link, valid for an hour). */
  file?: { url: string; name: string }
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
  author: WorkspaceMember
  comment: string
  /** What was reviewed; unset for a general review or when the item was deleted. */
  target?: EvaluationTarget
  /** 1–5 each. */
  scores: EvaluationScores
  createdAt: string
}

export interface EvaluationSummary {
  /** Average of all scores, out of 100 (null before the first evaluation). */
  score: number | null
  evaluations: Evaluation[]
}

export type LedgerKind = 'chat' | 'research' | 'review' | 'prototype' | 'team'

export interface LedgerEntry {
  id: string
  kind: LedgerKind
  /** Who did it, when the summary doesn't already start with their name. */
  actor?: string
  /** The backend's `summary`, e.g. "uploaded a new prototype version". */
  action: string
  /** Quoted message, file name or version. */
  detail?: string
  at: string
}

export interface ProjectTask {
  id: string
  title: string
  description: string
  /** ISO date, YYYY-MM-DD (optional in the backend). */
  dueDate?: string
  completed: boolean
  /** The backend allows one assignee; kept as a list for the avatar stack. */
  assignees: WorkspaceMember[]
  createdById: string
}

export interface NewTask {
  title: string
  description: string
  assigneeId: string
  dueDate: string
}
