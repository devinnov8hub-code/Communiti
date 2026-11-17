import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDots, CloudArrowUp, LinkSimple, X } from '@phosphor-icons/react'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, DateField, FieldError, Modal, SelectField, TextAreaField, TextField, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { EVENT_CATEGORIES } from '@/lib/events'
import { useCreateEvent } from '../hooks/queries'

const CATEGORIES = EVENT_CATEGORIES.map(({ value, label }) => ({ value, label: label.toUpperCase() }))
const MAX_BYTES = 5 * 1024 * 1024

const schema = z
  .object({
    title: z.string().trim().min(3, 'Give the event a title').max(160),
    category: z.enum(['hackathon', 'workshop', 'bootcamp', 'networking_fair'], { message: 'Pick an event type' }),
    startsAt: z.string().min(1, 'Pick a start date'),
    endsAt: z.string().min(1, 'Pick an end date'),
    location: z.string().trim().max(120),
    registrationUrl: z.string().trim().url('Enter the full link, starting with https://'),
    about: z.string().trim().min(20, 'Describe the event (20+ characters)').max(10000),
    organizer: z.string().trim().max(120),
  })
  .refine((values) => !values.startsAt || !values.endsAt || values.endsAt >= values.startsAt, {
    path: ['endsAt'],
    message: 'The end date must be after the start date',
  })
type Values = z.infer<typeof schema>

/** "Add Event" sheet (Figma "Add an event"). */
export function AddEventModal({ onClose }: { onClose: () => void }) {
  const create = useCreateEvent()
  const toast = useToast()
  const [cover, setCover] = useState<File>()
  const [coverError, setCoverError] = useState<string>()
  const [preview, setPreview] = useState<string>()
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      startsAt: '',
      endsAt: '',
      location: '',
      registrationUrl: '',
      about: '',
      organizer: '',
    },
  })

  const pickCover = (file?: File) => {
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return setCoverError('Use a PNG, JPG or WEBP image')
    if (file.size > MAX_BYTES) return setCoverError('Images must be 5MB or smaller')
    setCoverError(undefined)
    setCover(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = handleSubmit((values) =>
    create.mutate(
      {
        title: values.title,
        category: values.category,
        // Whole days, in the admin's time zone.
        startsAt: new Date(`${values.startsAt}T00:00`).toISOString(),
        endsAt: new Date(`${values.endsAt}T23:59`).toISOString(),
        venue: values.location || null,
        registrationUrl: values.registrationUrl,
        description: values.about,
        // The card shows a two-line summary.
        summary: values.about.slice(0, 300),
        organizerName: values.organizer || null,
        status: 'published',
        cover,
      },
      {
        onSuccess: () => {
          toast('Event added')
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
      title="Add Event"
      gap="sm"
      className="max-w-[676px] rounded-search [&_h2]:text-body-l"
      footer={
        <div className="flex gap-gap-lg py-2">
          <Button variant="outline" onClick={onClose} className="h-[42px] bg-surface-raised text-body-m">
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-event"
            loading={create.isPending}
            className="h-[42px] bg-brand-orange text-body-m"
          >
            Add Event
          </Button>
        </div>
      }
    >
      <form id="add-event" noValidate onSubmit={submit} className="flex flex-col gap-3">
        <CoverDropzone
          preview={preview}
          error={coverError}
          onPick={pickCover}
          onClear={() => {
            setCover(undefined)
            setPreview(undefined)
          }}
        />
        <TextField
          label="Event Title"
          placeholder="Innovate Challenge 2026"
          error={errors.title?.message}
          {...register('title')}
        />
        <SelectField
          label="Event Type/ Category"
          placeholder="Select an event type"
          options={CATEGORIES}
          className="[&_select]:text-brand-orange"
          error={errors.category?.message}
          {...register('category')}
        />
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-body-s text-fg-label">Date Range</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              label="Start date"
              placeholder="Start Date"
              icon={<CalendarDots />}
              className="[&>label]:sr-only"
              error={errors.startsAt?.message}
              {...register('startsAt')}
            />
            <DateField
              label="End date"
              placeholder="End date"
              icon={<CalendarDots />}
              className="[&>label]:sr-only"
              error={errors.endsAt?.message}
              {...register('endsAt')}
            />
          </div>
        </fieldset>
        <TextField
          label="Location (Optional)"
          placeholder="e.g Lagos Nigeria"
          error={errors.location?.message}
          {...register('location')}
        />
        <TextField
          label="Registration link(required)"
          type="url"
          inputMode="url"
          placeholder="http://www."
          icon={<LinkSimple />}
          error={errors.registrationUrl?.message}
          {...register('registrationUrl')}
        />
        <TextAreaField
          label="About this event"
          placeholder="What happens at this event, who it’s for, and what attendees will get out of it."
          rows={3}
          inputClassName="min-h-[64px]"
          error={errors.about?.message}
          {...register('about')}
        />
        <TextField
          label="Organized by"
          placeholder="e.g Innovation Hub"
          className="[&_input]:text-brand-green"
          error={errors.organizer?.message}
          {...register('organizer')}
        />
      </form>
    </Modal>
  )
}

function CoverDropzone({
  preview,
  error,
  onPick,
  onClear,
}: {
  preview?: string
  error?: string
  onPick: (file?: File) => void
  onClear: () => void
}) {
  const id = useId()
  const [dragging, setDragging] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          onPick(event.dataTransfer.files[0])
        }}
        className={cn(
          'relative flex h-[144px] cursor-pointer flex-col items-center justify-center gap-[7px] overflow-hidden rounded-control border border-dashed border-brand-orange bg-brand-orange-tint text-center text-brand-orange dark:bg-brand-orange/10',
          dragging && 'ring-2 ring-brand-orange',
        )}
      >
        {preview ? (
          <img src={preview} alt="Event cover preview" className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            <CloudArrowUp aria-hidden className="size-8" />
            <span className="text-body-s">Click to upload or drag and drop</span>
            <span className="text-caption">PNG, JPG or WEBP (Max 5MB)</span>
          </>
        )}
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => onPick(event.target.files?.[0])}
        />
      </label>
      {preview && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 self-end text-caption text-fg-muted hover:text-fg"
        >
          <X aria-hidden className="size-3.5" />
          Remove image
        </button>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
