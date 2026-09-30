import { UploadSimple, X } from '@phosphor-icons/react'
import { useId, useRef } from 'react'
import { cn } from '@/lib/cn'
import { FieldError } from './FieldShell'

interface FilePickerProps {
  /** Text above the control ("Upload a 1 minute video…"). */
  label?: string
  /** Text inside the control ("Upload media", "Upload CAD file"). */
  placeholder: string
  accept?: string
  file?: File
  onChange: (file: File | undefined) => void
  /**
   * `inline` — single-row box with an upload icon (create-project form);
   * `dropzone` — tall dashed area (version upload);
   * `dashed` — single-row dashed box (prototype thumbnail).
   */
  variant?: 'inline' | 'dropzone' | 'dashed'
  error?: string
  className?: string
}

/** File input styled like the Figma upload fields; shows the chosen file name. */
export function FilePicker({
  label,
  placeholder,
  accept,
  file,
  onChange,
  variant = 'inline',
  error,
  className,
}: FilePickerProps) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-body-s text-fg-label">
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative flex w-full rounded-control text-body-m text-fg-muted transition-colors',
          'focus-within:ring-1 focus-within:ring-brand-green hover:border-grey-40',
          variant === 'inline' && 'h-control items-center gap-2 border border-border-input/40 bg-surface px-2',
          variant === 'dashed' && 'h-10 items-center border border-dashed border-grey-40 px-2 text-body-s',
          variant === 'dropzone' &&
            'h-[95px] flex-col items-center justify-center gap-3 border border-dashed border-grey-40 bg-surface text-body-s',
          error && 'border-red-500',
        )}
      >
        {variant !== 'dashed' && <UploadSimple aria-hidden className="size-6 shrink-0 text-fg-muted" />}
        <span className={cn('min-w-0 truncate', file && 'text-fg')}>{file ? file.name : placeholder}</span>
        <input
          ref={input}
          id={id}
          type="file"
          accept={accept}
          aria-label={label ? undefined : placeholder}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.files?.[0])}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        {file && (
          <button
            type="button"
            aria-label="Remove file"
            onClick={() => {
              onChange(undefined)
              if (input.current) input.current.value = ''
            }}
            className={cn(
              'relative z-10 rounded-full p-1 text-fg-muted hover:bg-fg/5',
              variant === 'dropzone' ? 'absolute top-2 right-2' : 'ml-auto',
            )}
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
