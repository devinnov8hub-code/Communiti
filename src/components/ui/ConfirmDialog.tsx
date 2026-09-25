import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Small destructive-action confirmation built on <Modal>. */
export function ConfirmDialog({ open, title, message, confirmLabel, loading, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-[440px]">
      <p className="text-body-m text-fg-muted">{message}</p>
      <div className="flex gap-3">
        <Button variant="outline" className="h-[38px] rounded-full text-body-m" onClick={onClose}>
          Cancel
        </Button>
        <Button className="h-[38px] rounded-full bg-error text-body-m" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
