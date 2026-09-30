import { ApiError, apiRequest, USE_MOCK_API } from '@/lib/api/client'
import type { NewProject, Project, ProjectsTab } from '../types'
import { findProjectRecord, mockDelay, mockMembers, projectRecords, toProject } from './projects.mock'

/** Projects API contract. See README for the endpoint list. */
export interface ProjectsApi {
  getProjects(tab: ProjectsTab): Promise<Project[]>
  createProject(input: NewProject): Promise<Project>
  updateProject(id: string, input: NewProject): Promise<Project>
}

function toFormData(input: NewProject) {
  const form = new FormData()
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (value instanceof File) form.append(key, value)
    else if (Array.isArray(value)) value.forEach((item) => form.append(`${key}[]`, item))
    else form.append(key, String(value))
  }
  return form
}

const httpProjectsApi: ProjectsApi = {
  getProjects: (tab) => apiRequest(`/projects?scope=${tab}`),
  createProject: (input) => apiRequest('/projects', { method: 'POST', body: toFormData(input) }),
  updateProject: (id, input) => apiRequest(`/projects/${id}`, { method: 'PATCH', body: toFormData(input) }),
}

/* ------------------------- Mock (Figma content) ------------------------- */

const mockProjectsApi: ProjectsApi = {
  async getProjects(tab) {
    await mockDelay()
    const projects = projectRecords.map(toProject)
    return tab === 'mine' ? projects.filter((project) => project.isMine) : projects
  },
  async createProject(input) {
    await mockDelay(600)
    const id = `pr-${Date.now()}`
    const record = {
      id,
      title: input.title,
      owner: { id: 'me', name: 'You' },
      status: input.status,
      tags: [],
      description: input.pitch,
      coverUrl: input.media?.type.startsWith('image/') ? URL.createObjectURL(input.media) : undefined,
      membersCount: 1,
      members: [{ ...mockMembers[0], id: 'me', name: 'You', isYou: true }],
      pitch: input.pitch,
      problem: input.problem,
      solution: input.solution,
      impact: input.impact,
      rolesNeeded: input.rolesNeeded,
      membership: 'admin' as const,
      acceptRequests: true,
      createdAt: new Date().toISOString(),
    }
    projectRecords.unshift(record)
    return toProject(record)
  },
  async updateProject(id, input) {
    await mockDelay(600)
    const record = findProjectRecord(id)
    if (!record) throw new ApiError('This project no longer exists.', 404)
    Object.assign(record, {
      title: input.title,
      status: input.status,
      description: input.pitch,
      pitch: input.pitch,
      problem: input.problem,
      solution: input.solution,
      impact: input.impact,
      rolesNeeded: input.rolesNeeded,
    })
    return toProject(record)
  },
}

export const projectsApi: ProjectsApi = USE_MOCK_API ? mockProjectsApi : httpProjectsApi
