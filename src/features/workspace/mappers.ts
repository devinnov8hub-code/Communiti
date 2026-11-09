import { getRoleLabel } from '@/features/auth/user'
import type {
  JoinRequest as ApiJoinRequest,
  ResearchDoc as ApiResearchDoc,
  Project,
  ProjectMember,
  Prototype as ApiPrototype,
  PrototypeVersion as ApiPrototypeVersion,
  UserSummary,
} from '@/lib/api'
import { richTextToText } from './richText'
import type {
  JoinRequest,
  Membership,
  ProjectWorkspace,
  Prototype,
  PrototypeVersion,
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
