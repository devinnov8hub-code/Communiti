import { Briefcase, EnvelopeSimple, LinkSimple } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { Controller, useForm, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import schoolIcon from '@/assets/auth/school.svg'
import { Button, Divider, SelectField, TextAreaField, TextField, VerifyTick } from '@/components/ui'
import { uploadFile, type ApiFieldErrors, type SubmitRoleBody } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { SelectableRole } from '../roles'
import {
  innovatorSchema,
  learnerSchema,
  MAX_EVIDENCE_FILES,
  MAX_OTHER_CUE_FILES,
  professionalSchema,
  researcherSchema,
} from '../schemas'
import { EvidenceDropzone } from './EvidenceDropzone'
import { FormAlert } from './FormAlert'

const STAGE_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'closed', label: 'Closed' },
]

// Spelled the way the backend's automatic check recognises levels.
const LEVEL_OPTIONS = ['100', '200', '300', '400', '500', '600', 'ND2', 'HND 1', 'MSc', 'PhD'].map((level) => ({
  value: level,
  label: level,
}))

export interface RoleFormProps {
  /** Takes a promise because building the body can fail too (evidence uploads). */
  onSubmit: (body: SubmitRoleBody | Promise<SubmitRoleBody>) => Promise<void>
  pending: boolean
  error: string | null
  /** The server has verified the form: the ticks animate in. */
  verified: boolean
  /** Per-field messages from a refused submission. */
  fieldErrors: ApiFieldErrors
}

// The generated type loses the format of the email fields; the backend takes plain strings.
const roleBody = (body: { memberRole: SelectableRole; details: object }) => body as unknown as SubmitRoleBody

/**
 * Connects a form to the server's answer: refused fields get their message, and the ticks
 * stay grey until the server has verified the form. Keys look like `details.orcidId`.
 */
function useFieldTicks<T extends FieldValues, Output>(
  form: UseFormReturn<T, unknown, Output>,
  verified: boolean,
  fieldErrors: ApiFieldErrors,
) {
  const { setError } = form
  useEffect(() => {
    for (const [path, message] of Object.entries(fieldErrors)) {
      setError(path.replace(/^details\./, '') as FieldPath<T>, {
        type: 'server',
        message: Array.isArray(message) ? message.join(' ') : message,
      })
    }
  }, [fieldErrors, setError])

  return (name: FieldPath<T>) => <VerifyTick active={verified && Boolean(form.watch(name))} />
}

function Section({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-3.5">
      <div className="flex flex-col gap-2">
        <h2 className="text-body-l font-semibold text-fg-body">{title}</h2>
        <p className="text-body-s text-fg-muted">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Actions({ pending, error, verified }: Pick<RoleFormProps, 'pending' | 'error' | 'verified'>) {
  return (
    <>
      <FormAlert message={error} />
      {pending && (
        <p role="status" className={cn('text-center text-body-s', verified ? 'text-brand-green' : 'text-fg-muted')}>
          {verified ? 'Verified' : 'Verifying your details…'}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Submit
      </Button>
    </>
  )
}

export function ResearcherForm({ onSubmit, pending, error, verified, fieldErrors }: RoleFormProps) {
  const form = useForm<z.input<typeof researcherSchema>, unknown, z.output<typeof researcherSchema>>({
    resolver: zodResolver(researcherSchema),
    mode: 'onTouched',
    defaultValues: { institutionalEmail: '', orcidId: '', researchProjectLink: '', researchEvidence: '' },
  })
  const { register, handleSubmit, formState } = form
  const tick = useFieldTicks(form, verified, fieldErrors)

  return (
    <form
      noValidate
      onSubmit={handleSubmit((details) => onSubmit(roleBody({ memberRole: 'researcher', details })))}
      className="flex flex-col gap-6"
    >
      <Section
        title="Identity verification"
        description="Verify your identity using either your institutional email or ORCID iD"
      >
        <TextField
          label="Institutional email"
          type="email"
          autoComplete="email"
          placeholder="name@university.edu.ng"
          icon={<EnvelopeSimple className="size-6" />}
          trailing={tick('institutionalEmail')}
          error={formState.errors.institutionalEmail?.message}
          {...register('institutionalEmail', { deps: ['orcidId'] })}
        />
        <Divider label="OR" />
        <TextField
          label="ORCID ID (Recommended)"
          placeholder="e.g 0000-0006-0000-0004"
          trailing={tick('orcidId')}
          error={formState.errors.orcidId?.message}
          {...register('orcidId', { deps: ['institutionalEmail'] })}
        />
      </Section>

      <Section
        title="Research background"
        description="Tell us about your academic affiliation and research experience."
      >
        <TextField
          label="Research project link"
          type="url"
          placeholder="https://"
          trailing={tick('researchProjectLink')}
          error={formState.errors.researchProjectLink?.message}
          {...register('researchProjectLink')}
        />
        <TextAreaField
          label="Evidence of research"
          placeholder="write a brief description of your research"
          inputClassName="min-h-[116px]"
          rows={4}
          error={formState.errors.researchEvidence?.message}
          {...register('researchEvidence')}
        />
      </Section>

      <Actions pending={pending} error={error} verified={verified} />
    </form>
  )
}

export function InnovatorForm({ onSubmit, pending, error, verified, fieldErrors }: RoleFormProps) {
  const form = useForm<z.input<typeof innovatorSchema>, unknown, z.output<typeof innovatorSchema>>({
    resolver: zodResolver(innovatorSchema),
    mode: 'onTouched',
    defaultValues: { ventureName: '', description: '', evidenceLink: '', evidenceFiles: [], otherCueFiles: [] },
  })
  const { control, register, handleSubmit, formState } = form
  const tick = useFieldTicks(form, verified, fieldErrors)

  const buildBody = async ({
    evidenceFiles,
    otherCueFiles,
    ...details
  }: z.output<typeof innovatorSchema>): Promise<SubmitRoleBody> => {
    const upload = (files: File[]) =>
      Promise.all(files.map(async (file) => (await uploadFile(file, 'verification')).mediaId))
    const [evidenceFileIds, otherCueFileIds] = await Promise.all([upload(evidenceFiles), upload(otherCueFiles)])
    return { memberRole: 'innovator', details: { ...details, evidenceFileIds, otherCueFileIds } }
  }

  return (
    <form noValidate onSubmit={handleSubmit((values) => onSubmit(buildBody(values)))} className="flex flex-col gap-6">
      <Section title="Project / Venture" description="Tell us about your product or venture.">
        <TextField
          label="Project / venture name"
          placeholder="e.g green hill solutions"
          error={formState.errors.ventureName?.message}
          {...register('ventureName')}
        />
        <TextAreaField
          label="Short description"
          placeholder="briefly describe your project or venture..."
          inputClassName="min-h-[106px]"
          rows={4}
          error={formState.errors.description?.message}
          {...register('description')}
        />
      </Section>

      <Section title="Stage of Development" description="Select the current stage of your project.">
        <SelectField
          label="Select development stage"
          placeholder="none selected"
          options={STAGE_OPTIONS}
          error={formState.errors.developmentStage?.message}
          {...register('developmentStage')}
        />
      </Section>

      <Section title="Evidence of work" description="Upload or link to any supporting materials.">
        <TextField
          label="Link to a supporting material"
          type="url"
          placeholder="e.g article, pitch deck or publication"
          icon={<EnvelopeSimple className="size-6" />}
          trailing={tick('evidenceLink')}
          error={formState.errors.evidenceLink?.message}
          {...register('evidenceLink')}
        />
        <Divider label="OR" />
        <Controller
          control={control}
          name="evidenceFiles"
          render={({ field }) => (
            <EvidenceDropzone
              label="Evidence of work files"
              files={field.value}
              onChange={field.onChange}
              max={MAX_EVIDENCE_FILES}
            />
          )}
        />
      </Section>

      <Section
        title="Other cues"
        description="Add any other relevant achievements or recognition E.g. participation in hackathons/boot-camps, patents filed, awards won, etc."
      >
        <Controller
          control={control}
          name="otherCueFiles"
          render={({ field }) => (
            <EvidenceDropzone
              label="Other cues files"
              files={field.value}
              onChange={field.onChange}
              max={MAX_OTHER_CUE_FILES}
            />
          )}
        />
      </Section>

      <Actions pending={pending} error={error} verified={verified} />
    </form>
  )
}

export function ProfessionalForm({ onSubmit, pending, error, verified, fieldErrors }: RoleFormProps) {
  const form = useForm<z.input<typeof professionalSchema>, unknown, z.output<typeof professionalSchema>>({
    resolver: zodResolver(professionalSchema),
    mode: 'onTouched',
    defaultValues: { organizationName: '', profileLink: '', professionalTitle: '', workEmail: '' },
  })
  const { register, handleSubmit, formState } = form
  const tick = useFieldTicks(form, verified, fieldErrors)

  return (
    <form
      noValidate
      onSubmit={handleSubmit((details) => onSubmit(roleBody({ memberRole: 'professional', details })))}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3.5">
        <TextField
          label="Organization name"
          placeholder="e.g green hill solutions"
          autoComplete="organization"
          icon={<EnvelopeSimple className="size-6" />}
          trailing={tick('organizationName')}
          error={formState.errors.organizationName?.message}
          {...register('organizationName')}
        />
        <TextField
          label="Linkedin or professional profile page link"
          type="url"
          placeholder="e.g linkedin.com/in/profile"
          icon={<LinkSimple className="size-6" />}
          trailing={tick('profileLink')}
          error={formState.errors.profileLink?.message}
          {...register('profileLink')}
        />
        <TextField
          label="Professional title"
          placeholder="e.g Machinist"
          autoComplete="organization-title"
          icon={<Briefcase className="size-6" />}
          error={formState.errors.professionalTitle?.message}
          {...register('professionalTitle')}
        />
        <TextField
          label="Work or Institutional email"
          type="email"
          autoComplete="email"
          placeholder="e.g your@companyemail"
          icon={<EnvelopeSimple className="size-6" />}
          trailing={tick('workEmail')}
          error={formState.errors.workEmail?.message}
          {...register('workEmail')}
        />
      </div>

      <Actions pending={pending} error={error} verified={verified} />
    </form>
  )
}

export function LearnerForm({ onSubmit, pending, error, verified, fieldErrors }: RoleFormProps) {
  const form = useForm<z.input<typeof learnerSchema>, unknown, z.output<typeof learnerSchema>>({
    resolver: zodResolver(learnerSchema),
    mode: 'onTouched',
    defaultValues: { studentEmail: '', institution: '', courseOfStudy: '', level: '' },
  })
  const { register, handleSubmit, formState } = form
  const tick = useFieldTicks(form, verified, fieldErrors)

  return (
    <form
      noValidate
      onSubmit={handleSubmit((details) => onSubmit({ memberRole: 'learner', details }))}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3.5">
        <TextField
          label="Student email"
          type="email"
          autoComplete="email"
          placeholder="e.g gabriel@schoolemail.com"
          icon={<EnvelopeSimple className="size-6" />}
          trailing={tick('studentEmail')}
          error={formState.errors.studentEmail?.message}
          {...register('studentEmail')}
        />
        <TextField
          label="School/institution"
          placeholder="e.g Ahmadu Bello university"
          icon={<img src={schoolIcon} alt="" width={24} height={24} />}
          error={formState.errors.institution?.message}
          {...register('institution')}
        />
        <TextField
          label="Course/area of study"
          placeholder="e.g Business administration"
          error={formState.errors.courseOfStudy?.message}
          {...register('courseOfStudy')}
        />
        <SelectField
          label="Level/year"
          placeholder="e.g 200"
          options={LEVEL_OPTIONS}
          error={formState.errors.level?.message}
          {...register('level')}
        />
      </div>

      <Actions pending={pending} error={error} verified={verified} />
    </form>
  )
}
