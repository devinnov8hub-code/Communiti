import { getRoleLabel } from '@/features/auth/user'
import type {
  Evaluation as ApiEvaluation,
  JoinRequest as ApiJoinRequest,
  LedgerEntry as ApiLedgerEntry,
  ListEvaluationsResponse,
  ResearchDoc as ApiResearchDoc,
  Task as ApiTask,
  Project,
  ProjectMember,
  Prototype as ApiPrototype,
  PrototypeVersion as ApiPrototypeVersion,
  UserSummary,
} from '@/lib/api'
import { richTextToText } from './richText'
import type {
  Evaluation,
  EvaluationSummary,
  EvaluationTarget,
  JoinRequest,
  LedgerEntry,
  LedgerKind,
  Membership,
  ProjectWorkspace,
  Prototype,
  PrototypeVersion,
  ProjectTask,
  ResearchDoc,
  WorkspaceMember,
} from './types'

const roleLabel = (user: Pick<UserSummary, 'memberRole'>) => getRoleLabel({ role: user.memberRole ?? undefined })

/** Owners and admins manage the project; contributors and viewers are members. */
function membershipOf(project: Project): Membership {
  if (project.myRole === 'owner' || project.myRole === 'admin') return 'admin'
  if (project.myRole) return 'member'
  return project.joinRequestStatus === 'pending' ? 'pending' : 'none'
}

export const toWorkspaceUser = (user: UserSummary, myId?: string): WorkspaceMember => ({
  id: user.id,
  name: user.fullName,
  avatarUrl: user.avatarUrl ?? undefined,
  role: roleLabel(user),
  isYou: user.id === myId,
})

export const toWorkspaceMember = (member: ProjectMember, myId?: string): WorkspaceMember => ({
  ...toWorkspaceUser(member, myId),
  role: member.title || roleLabel(member),
  isOwner: member.role === 'owner',
})

export const toJoinRequest = (request: ApiJoinRequest): JoinRequest => ({
  id: request.id,
  user: toWorkspaceUser(request.user),
  message: request.message ?? undefined,
})

export function toWorkspace(project: Project, myId?: string): ProjectWorkspace {
  const membership = membershipOf(project)
  const isMember = membership === 'member' || membership === 'admin'
  return {
    id: project.id,
    title: project.title,
    ownerName: project.owner.fullName,
    status: project.status,
    membersCount: project.memberCount,
    members: (project.memberPreview.length ? project.memberPreview : project.memberAvatars).map((user) =>
      toWorkspaceUser(user, myId),
    ),
    coverUrl: project.coverUrl ?? undefined,
    videoUrl: project.videoUrl ?? undefined,
    pitch: project.pitch,
    problem: project.problem,
    solution: project.solution,
    membership,
    isOwner: project.myRole === 'owner',
    canContribute: isMember && project.myRole !== 'viewer',
    conversationId: (isMember && project.conversationId) || undefined,
  }
}

export const toPrototype = (prototype: ApiPrototype, myId?: string): Prototype => ({
  id: prototype.id,
  name: prototype.name,
  thumbnailUrl: prototype.coverUrl ?? undefined,
  createdAt: prototype.createdAt,
  createdBy: toWorkspaceUser(prototype.createdBy, myId),
  versionCount: prototype.versionCount,
})

/** A version's first file is what the screens preview and download. */
export function toPrototypeVersion(version: ApiPrototypeVersion, prototypeId: string, myId?: string): PrototypeVersion {
  const media = version.media[0]
  return {
    id: version.id,
    prototypeId,
    name: version.versionLabel,
    imageUrl: (media?.kind === 'image' && media.url) || undefined,
    file: media?.url ? { url: media.url, name: media.originalName ?? version.versionLabel } : undefined,
    editedBy: toWorkspaceUser(version.uploadedBy, myId),
    updatedAt: version.createdAt,
    commentsCount: version.commentCount,
  }
}

export const toResearchDoc = (doc: ApiResearchDoc): ResearchDoc => ({
  id: doc.id,
  title: doc.title,
  body: doc.kind === 'written' ? richTextToText(doc.content) : '',
  file: doc.file?.url ? { url: doc.file.url, name: doc.file.originalName ?? doc.title } : undefined,
  thumbnailUrl: (doc.file?.kind === 'image' && doc.file.url) || undefined,
  authorId: doc.author.id,
  updatedBy: doc.author.fullName,
  updatedAt: doc.updatedAt,
  commentsCount: doc.commentCount,
})

/** Names for the documents and versions evaluations point at (the backend only sends their ids). */
export interface EvaluationTargets {
  research: Map<string, string>
  versions: Map<string, Extract<EvaluationTarget, { kind: 'prototype' }>>
}

function targetOf(evaluation: ApiEvaluation, targets: EvaluationTargets): EvaluationTarget | undefined {
  if (evaluation.prototypeVersionId) return targets.versions.get(evaluation.prototypeVersionId)
  if (!evaluation.researchDocId) return undefined
  const title = targets.research.get(evaluation.researchDocId)
  return title ? { kind: 'research', id: evaluation.researchDocId, label: title } : undefined
}

export const toEvaluation = (evaluation: ApiEvaluation, targets: EvaluationTargets, myId?: string): Evaluation => ({
  id: evaluation.id,
  author: toWorkspaceUser(evaluation.expert, myId),
  comment: evaluation.feedback,
  target: targetOf(evaluation, targets),
  scores: {
    feasibility: evaluation.feasibility,
    sustainability: evaluation.sustainability,
    novelty: evaluation.novelty,
  },
  createdAt: evaluation.createdAt,
})

/** The three criteria averages (1–5) as one score out of 100. */
export function toEvaluationSummary(
  response: ListEvaluationsResponse,
  targets: EvaluationTargets,
  myId?: string,
): EvaluationSummary {
  const { feasibility, sustainability, novelty } = response.summary
  const averages = [feasibility, sustainability, novelty].filter((value): value is number => value !== null)
  const mean = averages.length ? averages.reduce((sum, value) => sum + value, 0) / averages.length : null
  return {
    score: mean === null ? null : Math.round((mean / 5) * 1000) / 10,
    evaluations: response.data.map((evaluation) => toEvaluation(evaluation, targets, myId)),
  }
}

/**
 * Ledger `type`s aren't documented as a fixed list, so entries are grouped by keyword
 * (e.g. `research_created`, `prototype_version_uploaded`); anything else is a team update.
 */
const LEDGER_KINDS: [RegExp, LedgerKind][] = [
  [/message|chat/, 'chat'],
  [/research/, 'research'],
  [/evaluation|review/, 'review'],
  [/prototype|version/, 'prototype'],
]

const LEDGER_DETAIL_KEYS = ['title', 'name', 'versionLabel', 'fileName', 'preview', 'text']

export function toLedgerEntry(entry: ApiLedgerEntry): LedgerEntry {
  const key = `${entry.type} ${entry.refType ?? ''}`.toLowerCase()
  const actor = entry.actor?.fullName
  const detail = LEDGER_DETAIL_KEYS.map((name) => entry.data[name]).find(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )
  return {
    id: entry.id,
    kind: LEDGER_KINDS.find(([pattern]) => pattern.test(key))?.[1] ?? 'team',
    // Some summaries already name the person ("Sarah joined the project").
    actor: actor && !entry.summary.startsWith(actor) ? actor : undefined,
    action: entry.summary,
    detail,
    at: entry.createdAt,
  }
}

export const toTask = (task: ApiTask, myId?: string): ProjectTask => ({
  id: task.id,
  title: task.title,
  description: task.description,
  dueDate: task.dueDate?.slice(0, 10) || undefined,
  completed: task.status === 'done',
  assignees: task.assignee ? [toWorkspaceUser(task.assignee, myId)] : [],
  createdById: task.createdBy.id,
})
