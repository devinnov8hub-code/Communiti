import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, PaperPlaneTilt, Stack } from '@phosphor-icons/react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ActionButton, SelectField, TextAreaField, TextField, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { AdminContent, Panel } from '../components/ui'
import { useAdminForums, useRecords, useSendNotification } from '../hooks/queries'

const AUDIENCES = [
  { value: 'all', label: 'All(Users, Forums, Projects)' },
  { value: 'users', label: 'Users' },
  { value: 'forums', label: 'Forums' },
  { value: 'projects', label: 'Projects' },
]

const schema = z.object({
  audience: z.enum(['all', 'users', 'forums', 'projects']),
  targetId: z.string().optional(),
  title: z.string().trim().min(3, 'Add a title').max(120),
  ids: z.string().trim().max(500).optional(),
  body: z.string().trim().min(10, 'Write the message (10+ characters)').max(2000),
})
type Values = z.infer<typeof schema>

/** System-wide notifications (Figma "NOTIFICATIONS"). */
export function NotificationsPage() {
  const send = useSendNotification()
  const toast = useToast()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { audience: 'all', targetId: '', title: '', ids: '', body: '' },
  })
  const audience = useWatch({ control, name: 'audience' })
  const groupKind = audience === 'forums' || audience === 'projects' ? audience : null
  // Only forums/projects can be narrowed to one group; first page of each is enough to pick from.
  const forums = useAdminForums({ page: 1 })
  const projects = useRecords('projects', { page: 1 })
  const groups = groupKind === 'forums' ? forums.data?.data : groupKind === 'projects' ? projects.data?.items : []
  const groupOptions = (groups ?? []).map((group) => ({ value: group.id, label: group.name }))

  const submit = handleSubmit((values) =>
    send.mutate(values, {
      onSuccess: () => {
        toast('Notification sent')
        reset()
      },
      onError: (error) => toast(getErrorMessage(error)),
    }),
  )

  return (
    <>
      <AdminTopBar title="Notifications" searchPlaceholder="Search in Events" />
      <AdminContent>
        <Panel className="max-w-[1104px] px-3.5 py-3 sm:px-[13px]">
          <form noValidate onSubmit={submit} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-4 text-body-l font-semibold text-fg-muted">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-orange-tint text-brand-orange dark:bg-brand-orange/15">
                <Bell aria-hidden className="size-3.5" />
              </span>
              Send system wide notifications to all users
            </h2>
            <SelectField
              label="Platform"
              placeholder="Choose who receives it"
              options={AUDIENCES}
              icon={<Stack className="size-[18px]" />}
              error={errors.audience?.message}
              {...register('audience')}
            />
            <SelectField
              label="Forum / Projects"
              placeholder={
                groupKind
                  ? `Select a ${groupKind === 'forums' ? 'forum' : 'project'} (optional)`
                  : 'Choose Forums or Projects above to target one'
              }
              options={groupOptions}
              disabled={!groupKind}
              {...register('targetId')}
            />
            <TextField
              label="Title"
              placeholder="e.g i have an important notification"
              error={errors.title?.message}
              {...register('title')}
            />
            <TextField
              label="IDs(optional)"
              placeholder="Send notification to a specific user, forum or project"
              error={errors.ids?.message}
              {...register('ids')}
            />
            <TextAreaField
              label="Body"
              placeholder="e.g i have an important notification"
              inputClassName="min-h-[125px]"
              error={errors.body?.message}
              {...register('body')}
            />
            <ActionButton
              type="submit"
              disabled={send.isPending}
              icon={<PaperPlaneTilt aria-hidden className="size-5" />}
              className="self-end py-2.5"
            >
              {send.isPending ? 'Sending…' : 'Send notification'}
            </ActionButton>
          </form>
        </Panel>
      </AdminContent>
    </>
  )
}
