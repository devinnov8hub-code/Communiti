import { Check } from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { Modal } from './Modal'

interface ReportDialogProps<T extends string> {
  open: boolean
  onClose: () => void
  title: string
  prompt: string
  reasons: readonly T[]
  submitLabel: string
  loading?: boolean
  error?: string
  onSubmit: (reasons: T[]) => void
}

/** "Report Post" / "Report Project" sheet — pick one or more reasons, then submit. */
export function ReportDialog<T extends string>({
  open,
  onClose,
  title,
  prompt,
  reasons,
  submitLabel,
  loading,
  error,
  onSubmit,
}: ReportDialogProps<T>) {
  const [selected, setSelected] = useState<T[]>([])

  const close = () => {
    setSelected([])
    onClose()
  }

  const toggle = (reason: T) =>
    setSelected((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason],
    )

  return (
    <Modal open={open} onClose={close} title={title}>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-body-m text-fg-muted">{prompt}</legend>
        {reasons.map((reason) => {
          const checked = selected.includes(reason)
          return (
            <label
              key={reason}
              className="flex cursor-pointer items-center gap-2 border-b border-hairline last:border-b-0"
            >
              <span className="flex size-12 shrink-0 items-center justify-center">
                <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => toggle(reason)} />
                <span
                  aria-hidden
                  className={cn(
                    'flex size-[18px] items-center justify-center rounded-[2px] border-2 transition-colors',
                    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-green',
                    checked ? 'border-danger-soft bg-danger-soft text-white' : 'border-fg-muted',
                  )}
                >
                  {checked && <Check weight="bold" className="size-3" />}
                </span>
              </span>
              <span className="text-body-s text-fg">{reason}</span>
            </label>
          )
        })}
      </fieldset>

      {error && (
        <p role="alert" className="text-body-s text-error">
          {error}
        </p>
      )}

      <Button
        onClick={() => selected.length > 0 && onSubmit(selected)}
        disabled={selected.length === 0}
        loading={loading}
        className="mt-5 mb-2 h-[38px] rounded-full bg-danger-soft font-normal"
      >
        {submitLabel}
      </Button>
    </Modal>
  )
}
