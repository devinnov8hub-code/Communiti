import type { ListProjectsQuery, Project } from '@/lib/api'

/** Projects → every public project plus yours; My Projects → projects you own or have joined. */
export type ProjectsTab = Extract<NonNullable<ListProjectsQuery['tab']>, 'all' | 'joined'>

export type ProjectStatus = Project['status']

/** "Create a project" / "Edit project" form values. */
export interface NewProject {
  title: string
  pitch: string
  problem: string
  solution: string
  status: ProjectStatus
  /** Pitch video or cover image. Images become the cover; videos the pitch video. */
  media?: File
  /** Uploaded to the project's Contracts. */
  contract?: File
}
