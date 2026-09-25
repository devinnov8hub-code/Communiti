import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../api/projects.service'
import type { ProjectsTab } from '../types'

export const projectKeys = {
  all: ['projects'] as const,
  list: (tab: ProjectsTab) => [...projectKeys.all, 'list', tab] as const,
}

export const useProjects = (tab: ProjectsTab) =>
  useQuery({ queryKey: projectKeys.list(tab), queryFn: () => projectsApi.getProjects(tab) })
