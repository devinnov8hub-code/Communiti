import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects.service'
import type { NewProject, ProjectsTab } from '../types'

export const projectKeys = {
  all: ['projects'] as const,
  list: (tab: ProjectsTab) => [...projectKeys.all, 'list', tab] as const,
}

export const useProjects = (tab: ProjectsTab) =>
  useQuery({ queryKey: projectKeys.list(tab), queryFn: () => projectsApi.getProjects(tab) })

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewProject) => projectsApi.createProject(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewProject) => projectsApi.updateProject(id, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        // The workspace caches the same project under its own key.
        queryClient.invalidateQueries({ queryKey: ['workspace', id] }),
      ]),
  })
}
