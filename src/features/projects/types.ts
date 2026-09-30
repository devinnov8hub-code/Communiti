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

export const PROJECT_ROLES = [
  { value: 'artisan', label: 'Artisan', description: 'Creates high quality designs for your project.' },
  { value: 'academic', label: 'Academic', description: 'Curates research and theoretical knowledge.' },
  { value: 'expert', label: 'Expert', description: 'A specialist with deep practical knowledge.' },
] as const
export type ProjectRole = (typeof PROJECT_ROLES)[number]['value']

/** "Create a project" form payload (sent as multipart/form-data). */
export interface NewProject {
  title: string
  pitch: string
  problem: string
  solution: string
  impact: string
  rolesNeeded: ProjectRole[]
  status: ProjectStatus
  media?: File
  contract?: File
}
