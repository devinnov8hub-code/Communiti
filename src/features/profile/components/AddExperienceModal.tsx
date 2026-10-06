import { CalendarDots } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, DateField, Modal, SelectField, TextField, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { useAddExperience } from '../hooks/queries'

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
] as const

const JOB_TYPES = [
  { value: 'on-site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
] as const

const schema = z
  .object({
    title: z.string().trim().min(2, 'Enter your job title'),
    company: z.string().trim().min(2, 'Enter the company'),
    location: z.string().trim().optional(),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance'], {
      error: 'Select employment type',
    }),
    jobType: z.enum(['on-site', 'remote', 'hybrid'], { error: 'Select job type' }),
    startDate: z.string().min(1, 'Select a start date'),
    endDate: z.string().optional(),
  })
  .refine((values) => !values.endDate || values.endDate >= values.startDate, {
    path: ['endDate'],
    message: 'End date must be after the start date',
  })
type Values = z.infer<typeof schema>

/** "Add work experience" sheet. Leave the end date empty for a current role. */
export function AddExperienceModal({ onClose }: { onClose: () => void }) {
  const add = useAddExperience()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const submit = handleSubmit(({ location, endDate, ...values }) =>
    add.mutate(
      { ...values, location: location || undefined, endDate: endDate || undefined },
      {
        onSuccess: () => {
          toast('Experience added')
          onClose()
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    ),
  )

  return (
    <Modal
      open
      onClose={onClose}
      title="Add work experience"
      gap="md"
      className="[&_h2]:text-body-l"
      footer={
        <Button
          type="submit"
          form="add-experience"
          loading={add.isPending}
          className="h-[38px] rounded-full bg-brand-orange font-normal"
        >
          Save
        </Button>
      }
    >
      <form id="add-experience" noValidate onSubmit={submit} className="flex flex-col gap-3">
        <TextField
          label="Job Title"
          placeholder="e.g Product Engineer"
          error={errors.title?.message}
          {...register('title')}
        />
        <TextField label="Company" placeholder="e.g Google" error={errors.company?.message} {...register('company')} />
        <TextField
          label="Location (Optional)"
          placeholder="e.g Lagos Nigeria"
          error={errors.location?.message}
          {...register('location')}
        />
        <SelectField
          label="Employment Type"
          placeholder="Select employment type"
          options={EMPLOYMENT_TYPES}
          error={errors.employmentType?.message}
          {...register('employmentType')}
        />
        <SelectField
          label="Job Type"
          placeholder="E.g remote"
          options={JOB_TYPES}
          error={errors.jobType?.message}
          {...register('jobType')}
        />
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-body-s text-fg-label">Date Range</legend>
          <div className="grid grid-cols-2 gap-3">
            <DateField
              label="Start date"
              placeholder="Start Date"
              className="[&>label]:sr-only"
              error={errors.startDate?.message}
              {...register('startDate')}
            />
            <DateField
              label="End date"
              placeholder="End date"
              className="[&>label]:sr-only"
              error={errors.endDate?.message}
              {...register('endDate')}
            />
          </div>
          <p className="flex items-center gap-1 text-caption text-fg-muted">
            <CalendarDots aria-hidden className="size-3.5" />
            Leave the end date empty if you currently work here.
          </p>
        </fieldset>
      </form>
    </Modal>
  )
}
