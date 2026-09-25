import type { TagTone } from '@/components/ui/Tag'

export type ProjectStatus = 'open' | 'in-progress' | 'closed'
export type ProjectsTab = 'all' | 'mine'

export interface ProjectMember {
  id: string
  name: string
  avatarUrl?: string
}

export interface ProjectTag {
  label: string
  tone: TagTone
}

export interface Project {
  id: string
  title: string
  owner: ProjectMember
  status: ProjectStatus
  tags: ProjectTag[]
  description: string
  coverUrl?: string
  membersCount: number
  /** A few members for the avatar stack. */
  members: ProjectMember[]
  /** Current user owns or has joined the project. */
  isMine: boolean
}
