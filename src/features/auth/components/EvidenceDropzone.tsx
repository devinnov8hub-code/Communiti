import { X } from '@phosphor-icons/react'
import { useId, useState, type DragEvent } from 'react'
import documentUpload from '@/assets/auth/document-upload.svg'
import { FieldError } from '@/components/ui'
import { cn } from '@/lib/cn'

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const MAX_SIZE_MB = 10

interface EvidenceDropzoneProps {
  label: string
  files: File[]
  onChange: (files: File[]) => void
  max: number
}

/** "Drag & Drop or Choose file" for verification evidence; files upload when the form is submitted. */
export function EvidenceDropzone({ label, files, onChange, max }: EvidenceDropzoneProps) {
  const id = useId()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = (added: File[]) => {
    const valid = added.filter((file) => ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_SIZE_MB * 1024 * 1024)
    const next = [...files, ...valid].slice(0, max)
    onChange(next)
    if (valid.length < added.length) setError(`Upload PDF, PNG or JPEG files up to ${MAX_SIZE_MB} MB`)
    else if (next.length < files.length + valid.length) setError(`You can upload up to ${max} files`)
    else setError(null)
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    add([...event.dataTransfer.files])
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center gap-3 rounded-md border border-dashed border-hairline bg-surface px-6 py-4',
          'text-center focus-within:ring-1 focus-within:ring-brand-green',
          dragging && 'border-brand-orange',
        )}
      >
        <img src={documentUpload} alt="" width={24} height={24} />
        <span className="flex flex-col gap-1">
          <span className="text-body-s font-medium text-fg">
            Drag &amp; Drop or <span className="text-brand-orange">Choose file</span> to upload
          </span>
          <span className="text-caption text-fg-muted">pdf, png, jpeg</span>
        </span>
        <input
          id={id}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          aria-label={label}
          className="sr-only"
          onChange={(event) => {
            add([...(event.target.files ?? [])])
            event.target.value = ''
          }}
        />
      </label>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-body-s text-fg">
              <span className="min-w-0 truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => {
                  onChange(files.filter((_, position) => position !== index))
                  setError(null)
                }}
                className="shrink-0 rounded-full p-1 text-fg-muted hover:bg-fg/5"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
