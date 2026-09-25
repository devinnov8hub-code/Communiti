import member1 from '@/assets/mock/member-1.webp'
import member2 from '@/assets/mock/member-2.webp'
import member3 from '@/assets/mock/member-3.webp'
import member4 from '@/assets/mock/member-4.webp'
import projectFarm from '@/assets/mock/project-farm.webp'
import { apiRequest, USE_MOCK_API } from '@/lib/api/client'
import type { Project, ProjectsTab } from '../types'

/** Projects API contract. See README for the endpoint list. */
export interface ProjectsApi {
  getProjects(tab: ProjectsTab): Promise<Project[]>
}

const httpProjectsApi: ProjectsApi = {
  getProjects: (tab) => apiRequest(`/projects?scope=${tab}`),
}

/* ------------------------- Mock (Figma content) ------------------------- */

const members = [member1, member2, member3, member4].map((avatarUrl, index) => ({
  id: `m-${index + 1}`,
  name: `Member ${index + 1}`,
  avatarUrl,
}))

const DRONE_DESCRIPTION =
  'Our agro-drone system transforms farming with AI-driven insights, enabling precise crop management to boost yields and sustainability. This technology paves the way for a more sustainable future in agriculture.'

const projects: Project[] = [
  {
    id: 'pr-1',
    title: 'Agricultural Drone',
    owner: { id: 'u-joseph', name: 'Dr joseph Feranmi' },
    status: 'open',
    tags: [
      { label: 'Agriculture', tone: 'success' },
      { label: 'Ai-driven', tone: 'info' },
      { label: 'Sustainability', tone: 'warning' },
    ],
    description: DRONE_DESCRIPTION,
    coverUrl: projectFarm,
    membersCount: 12,
    members,
    isMine: false,
  },
  {
    id: 'pr-2',
    title: 'Solar Cold Storage for Farmers',
    owner: { id: 'u-tobi', name: 'Tobi Adeyemi' },
    status: 'in-progress',
    tags: [
      { label: 'Agriculture', tone: 'success' },
      { label: 'Clean energy', tone: 'warning' },
    ],
    description:
      'Solar-powered cold rooms that help smallholder farmers cut post-harvest losses and sell produce at better prices.',
    coverUrl: projectFarm,
    membersCount: 8,
    members: members.slice(1),
    isMine: true,
  },
]

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

const mockProjectsApi: ProjectsApi = {
  async getProjects(tab) {
    await delay()
    return tab === 'mine' ? projects.filter((project) => project.isMine) : projects
  },
}

export const projectsApi: ProjectsApi = USE_MOCK_API ? mockProjectsApi : httpProjectsApi
