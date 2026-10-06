import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarBlank } from '@phosphor-icons/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DateField, Modal, SelectField, TextAreaField, TextField, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { useCreateTask, useMembers } from '../hooks/queries'
import { ModalActions } from './shared'

// Local calendar date (en-CA formats as YYYY-MM-DD).
const today = () => new Date().toLocaleDateString('en-CA')

const schema = z.object({
  title: z.string().trim().min(3, 'Give the task a title').max(100),
  description: z.string().trim().min(5, 'Describe what needs doing').max(1000),
  assigneeId: z.string().min(1, 'Choose who should do this'),
  dueDate: z
    .string()
    .min(1, 'Pick a due date')
    .refine((value) => value >= today(), 'The due date can’t be in the past'),
})
type Values = z.infer<typeof schema>

/** "Create a task" sheet (Figma "Tasks" › add task). */
export function CreateTaskModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const members = useMembers(projectId)
  const create = useCreateTask(projectId)
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', assigneeId: '', dueDate: '' },
  })

  const options = (members.data ?? []).map((member) => ({
    value: member.id,
    label: `${member.name}${member.isYou ? ' (You)' : ''} · ${member.role}`,
  }))

  const submit = handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: () => {
        toast('Task created')
        onClose()
      },
      onError: (error) => toast(getErrorMessage(error)),
    }),
  )

  return (
    <Modal open onClose={onClose} title="Create a task" gap="sm" className="max-w-[458px] [&_h2]:text-body-m">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <TextField label="Task Title" placeholder="Enter title" error={errors.title?.message} {...register('title')} />
        <TextAreaField
          label="Description"
          placeholder="Enter a description"
          error={errors.description?.message}
          {...register('description')}
        />
        <SelectField
          label="Assign To Member(s)"
          placeholder={members.isPending ? 'Loading members…' : 'Choose a member'}
          options={options}
          error={errors.assigneeId?.message}
          {...register('assigneeId')}
        />
        <DateField
          label="Due Date"
          placeholder="MM/DD/YY"
          min={today()}
          icon={<CalendarBlank />}
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />
        <ModalActions confirmLabel="Create Task" onCancel={onClose} loading={create.isPending} />
      </form>
    </Modal>
  )
}
