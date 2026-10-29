import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, Image, Wrench, type Icon } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, DateField, Switch, useToast } from '@/components/ui'
import { controlBoxClass } from '@/components/ui/controlStyles'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { AdminTopBar } from '../components/AdminTopBar'
import { AdminContent, Panel } from '../components/ui'
import {
  useCancelMaintenance,
  usePlatformSettings,
  useScheduleMaintenance,
  useUpcomingMaintenance,
  useUpdateSettings,
} from '../hooks/queries'

const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

const schema = z
  .object({
    message: z.string().trim().min(3, 'Write a message for members'),
    start: z.string().min(1, 'Pick a start date'),
    end: z.string().min(1, 'Pick an end date'),
    disableAccess: z.boolean(),
  })
  .refine((values) => values.start >= today(), { path: ['start'], message: 'Pick today or a later date' })
  .refine((values) => values.end >= values.start, { path: ['end'], message: 'End must be on or after the start' })

type Values = z.infer<typeof schema>

const when = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Platform settings (Figma "SETTINGS"): image prefetching and scheduled maintenance. */
export function SettingsPage() {
  return (
    <>
      <AdminTopBar title="Settings" />
      <AdminContent className="gap-gap-lg lg:pt-6">
        <ImageOptimization />
        <Maintenance />
      </AdminContent>
    </>
  )
}

function Card({
  icon: CardIcon,
  title,
  description,
  action,
  children,
}: {
  icon: Icon
  title: string
  description: string
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <Panel className="flex flex-col gap-3 px-5 py-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-3 text-h4 font-semibold text-fg">
            <span className="flex size-[31px] items-center justify-center rounded-md bg-brand-orange-tint text-brand-orange dark:bg-brand-orange/15">
              <CardIcon aria-hidden className="size-[18px]" />
            </span>
            {title}
          </h2>
          <p className="max-w-[760px] text-body-s text-fg-muted">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </Panel>
  )
}

function ImageOptimization() {
  const settings = usePlatformSettings()
  const update = useUpdateSettings()
  const toast = useToast()

  return (
    <Card
      icon={Image}
      title="Image Optimization"
      description="Image prefetching to load images in advance, allowing them to display faster as users navigate the app. This improves loading speed and creates a smoother experience but may increase data usage and memory consumption."
      action={
        <Switch
          label="Image prefetching"
          checked={settings.data?.imageOptimization ?? false}
          disabled={!settings.data || update.isPending}
          onChange={(imageOptimization) =>
            update.mutate(
              { imageOptimization },
              {
                onSuccess: () => toast(`Image prefetching ${imageOptimization ? 'on' : 'off'}`),
                onError: (error) => toast(getErrorMessage(error)),
              },
            )
          }
          className="mt-6"
        />
      }
    />
  )
}

function Maintenance() {
  // Bumped after scheduling so the form (date fields included) starts fresh.
  const [formKey, setFormKey] = useState(0)
  const upcoming = useUpcomingMaintenance()
  return (
    <Card
      icon={Wrench}
      title="Maintenance"
      description="Scheduled maintenance may cause users to experience errors, performance issues, or temporary service unavailability during the selected period. You can notify all users via email ahead of time and choose to temporarily disable access to the application until maintenance is completed."
    >
      <MaintenanceForm key={formKey} onScheduled={() => setFormKey((key) => key + 1)} />
      {upcoming.data && upcoming.data.data.length > 0 && <ScheduledList windows={upcoming.data.data} />}
    </Card>
  )
}

function MaintenanceForm({ onScheduled }: { onScheduled: () => void }) {
  const schedule = useScheduleMaintenance()
  const toast = useToast()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { message: '', start: '', end: '', disableAccess: false },
  })

  const submit = handleSubmit(({ message, start, end, disableAccess }) =>
    schedule.mutate(
      {
        message,
        // Whole days, in the admin's time zone.
        startsAt: new Date(`${start}T00:00`).toISOString(),
        endsAt: new Date(`${end}T23:59`).toISOString(),
        disableAccess,
        notifyUsers: true,
      },
      {
        onSuccess: () => {
          toast('Maintenance scheduled — members will get an email')
          onScheduled()
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    ),
  )

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-5 rounded-control bg-background px-3.5 py-4">
        <label className="flex flex-col gap-2">
          <span className="text-body-m font-semibold text-fg">Message users</span>
          <textarea
            placeholder="Enter a descriptive message to be sent to all users"
            aria-invalid={errors.message ? true : undefined}
            className={cn(
              controlBoxClass,
              'h-[144px] resize-none items-start text-body-s text-fg outline-none placeholder:text-fg-muted',
              errors.message && 'border-red-500',
            )}
            {...register('message')}
          />
          {errors.message && <span className="text-caption text-red-500">{errors.message.message}</span>}
        </label>

        <p className="flex items-center gap-4 text-body-m font-semibold text-fg">
          <span className="flex size-[31px] items-center justify-center rounded-md bg-brand-orange-tint text-brand-orange dark:bg-brand-orange/15">
            <Clock aria-hidden className="size-[18px]" />
          </span>
          Schedule the maintenance
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField
            label="Start date"
            placeholder="Select a date the maintenance is likely to start"
            min={today()}
            error={errors.start?.message}
            {...register('start')}
          />
          <DateField
            label="End date (Estimate)"
            placeholder="select a date the maintenance is likely to end"
            min={today()}
            error={errors.end?.message}
            {...register('end')}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-control bg-surface-raised px-3.5 py-3">
          <span className="text-body-m text-fg">
            Disable <span className="text-brand-orange">Communiti</span> during maintenance period?
          </span>
          <Controller
            control={control}
            name="disableAccess"
            render={({ field }) => (
              <Switch label="Disable Communiti during maintenance" checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>
      <Button
        type="submit"
        fullWidth={false}
        loading={schedule.isPending}
        className="h-[38px] self-end rounded-control bg-brand-orange px-4 text-body-m"
      >
        Schedule maintenance
      </Button>
    </form>
  )
}

function ScheduledList({
  windows,
}: {
  windows: NonNullable<ReturnType<typeof useUpcomingMaintenance>['data']>['data']
}) {
  const cancel = useCancelMaintenance()
  const toast = useToast()
  return (
    <section aria-label="Scheduled maintenance" className="flex flex-col gap-2 border-t border-hairline pt-3">
      <h3 className="text-body-m font-semibold text-fg">Scheduled</h3>
      <ul className="flex flex-col gap-2">
        {windows.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 text-body-s">
            <span className="text-fg">
              {when.format(new Date(item.startsAt))} – {when.format(new Date(item.endsAt))}
              <span className="text-fg-muted">
                {' · '}
                {item.state === 'active' ? 'Running now' : 'Scheduled'}
                {item.disableAccess && ' · App disabled'}
              </span>
            </span>
            <button
              type="button"
              disabled={cancel.isPending}
              onClick={() =>
                cancel.mutate(item.id, {
                  onSuccess: () => toast('Maintenance cancelled'),
                  onError: (error) => toast(getErrorMessage(error)),
                })
              }
              className="text-caption font-semibold text-error hover:underline disabled:opacity-60"
            >
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
