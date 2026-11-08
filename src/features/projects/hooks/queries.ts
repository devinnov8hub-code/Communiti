import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, projectsApi, uploadFile, workspaceApi, type UpdateProjectBody } from '@/lib/api'
import type { NewProject, ProjectsTab } from '../types'

export const projectKeys = {
  all: ['projects'] as const,
  list: (tab: ProjectsTab) => [...projectKeys.all, 'list', tab] as const,
  user: (userId: string) => [...projectKeys.all, 'user', userId] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
}

/** Newest first, a page at a time. */
export const useProjects = (tab: ProjectsTab) =>
  useInfiniteQuery({
    queryKey: projectKeys.list(tab),
    queryFn: ({ pageParam }) => projectsApi.listProjects({ tab, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.data),
  })

/** A member's projects (profile Projects tab). */
export const useUserProjects = (userId: string) =>
  useQuery({
    queryKey: projectKeys.user(userId),
    queryFn: () => projectsApi.listUserProjects(userId, { limit: 50 }).then((page) => page.data),
    enabled: Boolean(userId),
  })

export const useProject = (id: string) =>
  useQuery({ queryKey: projectKeys.detail(id), queryFn: () => projectsApi.getProject(id), enabled: Boolean(id) })

/** The picked media becomes the cover (images) or the pitch video (videos). */
async function uploadMedia(file: File): Promise<Pick<UpdateProjectBody, 'coverUrl' | 'videoUrl'>> {
  const { publicUrl } = await uploadFile(file, 'project')
  if (!publicUrl) throw new ApiError('The media couldn’t be published. Please try another file.', 0)
  return file.type.startsWith('video/') ? { videoUrl: publicUrl } : { coverUrl: publicUrl }
}

/** Adds the contract file to the project's Contracts (admins see it in the workspace). */
async function uploadContract(projectId: string, file: File) {
  const { mediaId } = await uploadFile(file, 'contract')
  await workspaceApi.createContract(projectId, { title: file.name.slice(0, 200), mediaId })
}

function useInvalidateProject() {
  const client = useQueryClient()
  return (id: string) =>
    Promise.all([
      client.invalidateQueries({ queryKey: projectKeys.all }),
      // The workspace caches the same project under its own key.
      client.invalidateQueries({ queryKey: ['workspace', id] }),
    ])
}

export function useCreateProject() {
  const invalidate = useInvalidateProject()
  return useMutation({
    mutationFn: async ({ media, contract, status, ...fields }: NewProject) => {
      const project = await projectsApi.createProject({ ...fields, ...(media && (await uploadMedia(media))) })
      // New projects always start open; the status is only editable afterwards.
      if (status !== 'open') await projectsApi.updateProject(project.id, { status })
      if (contract) await uploadContract(project.id, contract)
      return project
    },
    onSuccess: (project) => invalidate(project.id),
  })
}

export function useUpdateProject(id: string) {
  const invalidate = useInvalidateProject()
  return useMutation({
    mutationFn: async ({ media, contract, ...fields }: NewProject) => {
      const project = await projectsApi.updateProject(id, { ...fields, ...(media && (await uploadMedia(media))) })
      if (contract) await uploadContract(id, contract)
      return project
    },
    onSuccess: () => invalidate(id),
  })
}
