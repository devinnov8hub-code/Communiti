import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from '@phosphor-icons/react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { paths } from '@/app/paths'
import {
  Button,
  Checkbox,
  FieldError,
  FilePicker,
  SelectField,
  Spinner,
  TextAreaField,
  TextField,
  useToast,
} from '@/components/ui'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import { useWorkspace } from '@/features/workspace/hooks/queries'
import type { ProjectWorkspace } from '@/features/workspace/types'
import { getErrorMessage } from '@/lib/api/errors'
import { useCreateProject, useUpdateProject } from '../hooks/queries'
import { PROJECT_ROLES, type NewProject, type ProjectRole, type ProjectStatus } from '../types'

const MAX_WORDS = 150
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
const essay = (message: string) =>
  z
    .string()
    .trim()
    .min(20, message)
    .refine((text) => wordCount(text) <= MAX_WORDS, `Keep it to ${MAX_WORDS} words`)

const schema = z.object({
  title: z.string().trim().min(3, 'Give your project a title').max(80),
  pitch: essay('Pitch your project (20+ characters)'),
  problem: essay('Describe the problem (20+ characters)'),
  solution: essay('Describe your solution (20+ characters)'),
  impact: essay('Describe the impact (20+ characters)'),
  rolesNeeded: z.array(z.enum(['artisan', 'academic', 'expert'])).min(1, 'Pick at least one role'),
  status: z.enum(['open', 'in-progress', 'closed']),
})
type Values = z.infer<typeof schema>

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
]

/** "Create a project" (Figma WORKSPACE › Creating a project); also edits an existing project. */
export function ProjectFormPage() {
  const { projectId } = useParams()
  const workspace = useWorkspace(projectId ?? '')

  if (!projectId) return <ProjectForm />

  if (workspace.isPending)
    return (
      <div className="flex justify-center py-24 text-brand-orange">
        <Spinner />
      </div>
    )
  if (workspace.isError) return <p className="p-10 text-center text-fg-muted">{getErrorMessage(workspace.error)}</p>
  // Only project admins can edit the details.
  if (workspace.data.membership !== 'admin') return <Navigate to={paths.project(projectId)} replace />
  return <ProjectForm project={workspace.data} />
}

function ProjectForm({ project }: { project?: ProjectWorkspace }) {
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreateProject()
  const update = useUpdateProject(project?.id ?? '')
  const saving = create.isPending || update.isPending
  const [media, setMedia] = useState<File>()
  const [contract, setContract] = useState<File>()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: project?.title ?? '',
      pitch: project?.pitch ?? '',
      problem: project?.problem ?? '',
      solution: project?.solution ?? '',
      impact: project?.impact ?? '',
      rolesNeeded: project?.rolesNeeded ?? [],
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
          <TextAreaField
            label="Project impact"
            placeholder={`How would your project impact society, explain in ${MAX_WORDS} words`}
            inputClassName="min-h-[148px]"
            error={errors.impact?.message}
            {...register('impact')}
          />
        </section>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-body-m font-semibold text-fg">Roles Needed</legend>
          <Controller
            control={control}
            name="rolesNeeded"
            render={({ field }) => (
              <>
                {PROJECT_ROLES.map((role) => {
                  const checked = field.value.includes(role.value)
                  const toggle = () =>
                    field.onChange(
                      checked
                        ? field.value.filter((value: ProjectRole) => value !== role.value)
                        : [...field.value, role.value],
                    )
                  return (
                    <Checkbox
                      key={role.value}
                      checked={checked}
                      onChange={toggle}
                      label={
                        <span className="flex flex-col gap-0.5">
                          <span className="text-body-m text-fg">{role.label}</span>
                          <span className="text-body-s text-fg-subtle">{role.description}</span>
                        </span>
                      }
                    />
                  )
                })}
              </>
            )}
          />
          {errors.rolesNeeded && <FieldError>{errors.rolesNeeded.message}</FieldError>}
        </fieldset>

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
            options={STATUS_OPTIONS}
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
