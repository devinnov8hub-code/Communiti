import { CloudArrowUp, X } from '@phosphor-icons/react'
import { useDeferredValue, useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { Button, Divider, FieldError, Modal, SelectField, TextField, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { formatDateRange } from '@/lib/format'
import { useCreateHighlight, useEventOptions } from '../hooks/queries'

const MAX_BYTES = 10 * 1024 * 1024
const MAX_IMAGES = 20

/** "Add Highlights" sheet: name a new group or attach it to an event, then add photos. */
export function AddHighlightsModal({ onClose }: { onClose: () => void }) {
  const create = useCreateHighlight()
  const toast = useToast()
  const inputId = useId()
  const [title, setTitle] = useState('')
  const [eventId, setEventId] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const events = useEventOptions(useDeferredValue(eventSearch.trim()) || undefined)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<{ source?: string; images?: string }>({})

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  const eventOptions = (events.data?.data ?? []).map((event) => ({
    value: event.id,
    label: `${event.title} · ${formatDateRange(event.startsAt, event.endsAt)}`,
  }))

  const addFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    const valid = picked.filter((file) => /^image\/(png|jpe?g|webp)$/.test(file.type) && file.size <= MAX_BYTES)
    const room = MAX_IMAGES - files.length
    setErrors((current) => ({
      ...current,
      images:
        valid.length > room
          ? `Up to ${MAX_IMAGES} images per highlight`
          : valid.length < picked.length
            ? 'Some files were skipped (PNG, JPG or WEBP up to 10MB)'
            : undefined,
    }))
    setFiles((current) => [...current, ...valid.slice(0, room)])
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next = {
      source: title.trim() || eventId ? undefined : 'Give the highlights a title or choose an event',
      images: files.length ? undefined : 'Add at least one image',
    }
    setErrors(next)
    if (next.source || next.images) return
    create.mutate(
      { title: title.trim() || undefined, eventId: eventId || undefined, images: files },
      {
        onSuccess: () => {
          toast('Highlights added')
          onClose()
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Highlights"
      gap="sm"
      className="rounded-search [&_h2]:text-body-l"
      footer={
        <div className="flex gap-gap-lg py-2">
          <Button variant="outline" onClick={onClose} className="h-[42px] bg-surface-raised text-body-m">
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-highlights"
            loading={create.isPending}
            className="h-[42px] bg-brand-orange text-body-m"
          >
            Add Highlights
          </Button>
        </div>
      }
    >
      <form id="add-highlights" noValidate onSubmit={submit} className="flex flex-col gap-3">
        <TextField
          label="Title / Name"
          placeholder="Enter title for this highlights"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Divider label="OR" />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-body-s text-fg-label">Use an existing event</legend>
          <TextField
            label="Search events"
            type="search"
            placeholder="Search past and upcoming events"
            value={eventSearch}
            onChange={(event) => setEventSearch(event.target.value)}
            className="[&>label]:sr-only"
          />
          <SelectField
            label="Event"
            placeholder={events.isPending ? 'Loading events…' : 'Select an event'}
            options={eventOptions}
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            className="[&>label]:sr-only"
          />
        </fieldset>
        {errors.source && <FieldError>{errors.source}</FieldError>}

        <div className="flex flex-col gap-2 pt-2">
          <h3 className="text-body-m font-semibold text-fg">Images</h3>
          <p className="text-body-s text-fg-muted">Add multiple images to create a highlights group.</p>
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <li className="col-span-2 sm:col-span-1">
              <label
                htmlFor={inputId}
                className="flex h-[97px] cursor-pointer flex-col items-center justify-center gap-1 rounded-control border border-dashed border-brand-orange bg-brand-orange-tint text-center text-brand-orange dark:bg-brand-orange/10"
              >
                <CloudArrowUp aria-hidden className="size-6" />
                <span className="text-caption font-semibold">Upload Images</span>
                <span className="text-xs">PNG, JPG, WEBP · Max 10MB per image</span>
              </label>
              <input
                id={inputId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </li>
            {previews.map((url, index) => (
              <li key={url} className="relative h-[97px] overflow-hidden rounded-control">
                <img src={url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          {errors.images && <FieldError>{errors.images}</FieldError>}
        </div>
      </form>
    </Modal>
  )
}
