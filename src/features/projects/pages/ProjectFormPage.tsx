import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from '@phosphor-icons/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { paths } from '@/app/paths'
import { Button, FilePicker, SelectField, Spinner, TextAreaField, TextField, useToast } from '@/components/ui'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import { getErrorMessage, type Project } from '@/lib/api'
import { useCreateProject, useProject, useUpdateProject } from '../hooks/queries'
import type { NewProject, ProjectStatus } from '../types'

const MAX_WORDS = 150
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
const essay = (message: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(20, message)
    .max(maxLength, `Keep it under ${maxLength} characters`)
    .refine((text) => wordCount(text) <= MAX_WORDS, `Keep it to ${MAX_WORDS} words`)

// Length limits are the backend's.
const schema = z.object({
  title: z.string().trim().min(3, 'Give your project a title').max(120, 'Keep the title under 120 characters'),
  pitch: essay('Pitch your project (20+ characters)', 500),
  problem: essay('Describe the problem (20+ characters)', 5000),
  solution: essay('Describe your solution (20+ characters)', 5000),
  status: z.enum(['open', 'ongoing', 'completed', 'archived']),
})
type Values = z.infer<typeof schema>

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'ongoing', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]
/** Archiving is only offered for an existing project. */
const EDIT_STATUS_OPTIONS = [...STATUS_OPTIONS, { value: 'archived' as const, label: 'Archived' }]

/** "Create a project" (Figma WORKSPACE › Creating a project); also edits an existing project. */
export function ProjectFormPage() {
  const { projectId } = useParams()
  const project = useProject(projectId ?? '')

  if (!projectId) return <ProjectForm />

  if (project.isPending)
    return (
      <div className="flex justify-center py-24 text-brand-orange">
        <Spinner />
      </div>
    )
  if (project.isError) return <p className="p-10 text-center text-fg-muted">{getErrorMessage(project.error)}</p>
  // Only the owner and project admins can edit the details.
  if (project.data.myRole !== 'owner' && project.data.myRole !== 'admin')
    return <Navigate to={paths.project(projectId)} replace />
  return <ProjectForm project={project.data} />
}

function ProjectForm({ project }: { project?: Project }) {
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreateProject()
  const update = useUpdateProject(project?.id ?? '')
  const saving = create.isPending || update.isPending
  const [media, setMedia] = useState<File>()
  const [contract, setContract] = useState<File>()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: project?.title ?? '',
      pitch: project?.pitch ?? '',
      problem: project?.problem ?? '',
      solution: project?.solution ?? '',
      status: project?.status ?? 'open',
    },
  })

  const submit = handleSubmit((values) => {
    const input: NewProject = { ...values, media, contract }
    const onError = (error: unknown) => toast(getErrorMessage(error))
    if (project) {
      update.mutate(input, {
        onSuccess: () => {
          toast('Project updated')
          navigate(paths.project(project.id))
        },
        onError,
      })
    } else {
      create.mutate(input, {
        onSuccess: (created) => {
          toast('Project created')
          navigate(paths.project(created.id))
        },
        onError,
      })
    }
  })

  return (
    <>
      <SearchHeader searchClassName="max-w-[668px]" />
      <form
        onSubmit={submit}
        noValidate
        className="mx-auto flex w-full max-w-[869px] flex-col gap-gap-md px-4 pt-6 pb-12 sm:px-6"
      >
        <h1 className="text-h4 font-semibold text-fg">{project ? 'Edit project' : 'Create a project'}</h1>

        <section aria-labelledby="overview-heading" className="flex flex-col gap-3">
          <h2 id="overview-heading" className="text-body-m font-semibold text-fg">
            Project Overview
          </h2>
          <FilePicker
            label="Upload a 1 minute video of yourself or a pitch of your product"
            placeholder="Upload media"
            accept="video/*,image/*"
            file={media}
            onChange={setMedia}
          />
          <TextField
            label="Project Title"
            placeholder="Enter title"
            error={errors.title?.message}
            {...register('title')}
          />
          <TextAreaField
            label="Pitch"
            placeholder={`Pitch your project in ${MAX_WORDS} words`}
            inputClassName="min-h-[148px]"
            error={errors.pitch?.message}
            {...register('pitch')}
          />
          <TextAreaField
            label="Problem statement"
            placeholder={`what problem does your project solve, explain in ${MAX_WORDS} words`}
            inputClassName="min-h-[148px]"
            error={errors.problem?.message}
            {...register('problem')}
          />
          <TextAreaField
            label="Project solution"
            placeholder={`What solution does your project bring , explain in ${MAX_WORDS} words`}
            inputClassName="min-h-[148px]"
            error={errors.solution?.message}
            {...register('solution')}
          />
        </section>

        <section aria-labelledby="contract-heading" className="flex flex-col gap-3">
          <h2 id="contract-heading" className="text-body-m font-semibold text-fg">
            Legal Contract
          </h2>
          <FilePicker
            label="Upload Contract"
            placeholder="Upload legal document"
            accept=".pdf,.doc,.docx"
            file={contract}
            onChange={setContract}
          />
        </section>

        <section aria-labelledby="status-heading" className="flex flex-col gap-3">
          <h2 id="status-heading" className="text-body-m font-semibold text-fg">
            Status
          </h2>
          <SelectField
            label="Project stage"
            placeholder="Select a stage"
            options={project ? EDIT_STATUS_OPTIONS : STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
          {!project && (
            <p className="flex items-start gap-2 rounded-control bg-brand-orange-tint px-5 py-2.5 text-body-s text-brand-orange">
              <Info aria-hidden className="mt-px size-4 shrink-0" />
              By default your project is set to open because you just started it.
            </p>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:gap-6">
          <Button
            variant="outline"
            onClick={() => navigate(project ? paths.project(project.id) : paths.projects)}
            className="h-auto border-0 bg-grey-30 py-[15px] text-body-m text-grey-50 hover:bg-grey-30/80"
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="h-auto bg-brand-orange py-[15px] text-body-m">
            {project ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </>
  )
}
