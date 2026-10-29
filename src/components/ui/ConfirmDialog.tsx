import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { controlBoxClass } from './controlStyles'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  loading?: boolean
  /** Ask for a reason in a text box (admin "action model"); it is passed to `onConfirm`. */
  withReason?: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}

/** Small destructive-action confirmation built on <Modal>. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  loading,
  withReason,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  // Start each opening with an empty reason.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setReason('')
  }

  return (
    <Modal open={open} onClose={onClose} title={title} className={withReason ? 'max-w-[676px]' : 'max-w-[440px]'}>
      <p className="text-body-m text-fg-muted">{message}</p>
      {withReason && (
        <textarea
          aria-label="Reason"
          placeholder="Enter a reason..."
          maxLength={1000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={cn(
            controlBoxClass,
            'h-[130px] resize-none items-start text-body-m text-fg outline-none placeholder:text-fg-muted placeholder:italic',
          )}
        />
      )}
      <div className="flex gap-3">
        <Button variant="outline" className="h-[38px] rounded-full text-body-m" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="h-[38px] rounded-full bg-error text-body-m"
          loading={loading}
          onClick={() => onConfirm(reason.trim())}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
