import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDots, CloudArrowUp, LinkSimple, X } from '@phosphor-icons/react'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, DateField, FieldError, Modal, SelectField, TextAreaField, TextField, useToast } from '@/components/ui'
import type { AdminUpdateEventBody, Event as CommunityEvent } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { EVENT_CATEGORIES, eventCategoryLabel } from '@/lib/events'
import { useCreateEvent, useUpdateEvent } from '../hooks/queries'

const CATEGORIES = EVENT_CATEGORIES.map(({ value, label }) => ({ value, label: label.toUpperCase() }))
const MAX_BYTES = 5 * 1024 * 1024

const schema = z
  .object({
    title: z.string().trim().min(3, 'Give the event a title').max(160),
    // The form offers the four dashboard types; an older event may carry another one, which edits keep.
    category: z.enum(
      ['hackathon', 'workshop', 'bootcamp', 'networking_fair', 'meetup', 'conference', 'webinar', 'other'],
      {
        message: 'Pick an event type',
      },
    ),
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
type NewEventCategory = (typeof EVENT_CATEGORIES)[number]['value']

/** "2026-11-17" in the admin's time zone: the value a date input expects. */
function toDay(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function defaultsFor(event?: CommunityEvent): Partial<Values> {
  if (!event) {
    return { title: '', startsAt: '', endsAt: '', location: '', registrationUrl: '', about: '', organizer: '' }
  }
  return {
    title: event.title,
    category: event.category,
    startsAt: toDay(event.startsAt),
    endsAt: toDay(event.endsAt),
    location: event.venue ?? '',
    registrationUrl: event.registrationUrl ?? '',
    about: event.description || event.summary || '',
    organizer: event.organizerName ?? '',
  }
}

/**
 * "Add Event" sheet (Figma "Add an event"). Pass `event` to edit it instead: the same form,
 * prefilled, saving only the fields the admin changed (so exact times set elsewhere, the
 * organizer's logo and the draft/published status stay as they are).
 */
export function EventFormModal({ event, onClose }: { event?: CommunityEvent; onClose: () => void }) {
  const editing = Boolean(event)
  const create = useCreateEvent()
  const update = useUpdateEvent()
  const toast = useToast()
  // undefined: keep the current cover · null: remove it · File: upload this one instead.
  const [cover, setCover] = useState<File | null>()
  const [coverError, setCoverError] = useState<string>()
  const [preview, setPreview] = useState<string | undefined>(event?.coverUrl ?? undefined)
  useEffect(() => () => (preview?.startsWith('blob:') ? URL.revokeObjectURL(preview) : undefined), [preview])

  const [defaults] = useState(() => defaultsFor(event))
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults })

  // An older event's type stays selectable, though new events can't use it.
  const categories =
    event && !CATEGORIES.some((option) => option.value === event.category)
      ? [...CATEGORIES, { value: event.category, label: eventCategoryLabel(event.category).toUpperCase() }]
      : CATEGORIES

  const pickCover = (file?: File) => {
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return setCoverError('Use a PNG, JPG or WEBP image')
    if (file.size > MAX_BYTES) return setCoverError('Images must be 5MB or smaller')
    setCoverError(undefined)
    setCover(file)
    setPreview(URL.createObjectURL(file))
  }

  const toBody = (values: Values) => ({
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
  })

  const finish = (message: string) => ({
    onSuccess: () => {
      toast(message)
      onClose()
    },
    onError: (error: unknown) => toast(getErrorMessage(error)),
  })

  const submit = handleSubmit((values) => {
    const body = toBody(values)
    if (!event) {
      const category = body.category as NewEventCategory
      create.mutate({ ...body, category, status: 'published', cover: cover ?? undefined }, finish('Event added'))
      return
    }
    const patch: AdminUpdateEventBody = {}
    if (dirtyFields.title) patch.title = body.title
    if (dirtyFields.category) patch.category = body.category
    // Both ends together: the API checks that the event ends after it starts.
    if (dirtyFields.startsAt || dirtyFields.endsAt) {
      patch.startsAt = body.startsAt
      patch.endsAt = body.endsAt
    }
    if (dirtyFields.location) patch.venue = body.venue
    if (dirtyFields.registrationUrl) patch.registrationUrl = body.registrationUrl
    if (dirtyFields.about) {
      patch.description = body.description
      patch.summary = body.summary
    }
    if (dirtyFields.organizer) patch.organizerName = body.organizerName
    if (Object.keys(patch).length === 0 && cover === undefined) return onClose()
    update.mutate({ id: event.id, ...patch, cover }, finish('Event updated'))
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Edit Event' : 'Add Event'}
      gap="sm"
      className="max-w-[676px] rounded-search [&_h2]:text-body-l"
      footer={
        <div className="flex gap-gap-lg py-2">
          <Button variant="outline" onClick={onClose} className="h-[42px] bg-surface-raised text-body-m">
            Cancel
          </Button>
          <Button
            type="submit"
            form="event-form"
            loading={create.isPending || update.isPending}
            className="h-[42px] bg-brand-orange text-body-m"
          >
            {editing ? 'Save changes' : 'Add Event'}
          </Button>
        </div>
      }
    >
      <form id="event-form" noValidate onSubmit={submit} className="flex flex-col gap-3">
        <CoverDropzone
          preview={preview}
          error={coverError}
          onPick={pickCover}
          onClear={() => {
            // Editing: clears the saved cover. Adding: there is nothing saved to clear.
            setCover(editing ? null : undefined)
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
          options={categories}
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
              defaultValue={defaults.startsAt}
              error={errors.startsAt?.message}
              {...register('startsAt')}
            />
            <DateField
              label="End date"
              placeholder="End date"
              icon={<CalendarDots />}
              className="[&>label]:sr-only"
              defaultValue={defaults.endsAt}
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
