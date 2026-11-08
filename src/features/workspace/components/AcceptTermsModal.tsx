import { Button, Modal } from '@/components/ui'
import type { ProjectWorkspace } from '../types'
import { ContractTerms } from './ContractTerms'

interface AcceptTermsModalProps {
  workspace: ProjectWorkspace
  loading: boolean
  error?: string
  onAgree: () => void
  onClose: () => void
}

/** Terms a user must accept before asking to join (Figma "Accept Terms"). */
export function AcceptTermsModal({ workspace, loading, error, onAgree, onClose }: AcceptTermsModalProps) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Accept Terms"
      footer={
        <div className="flex gap-2.5 py-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-[38px] rounded-full border-0 bg-surface font-normal text-brand-orange"
          >
            Cancel
          </Button>
          <Button onClick={onAgree} loading={loading} className="h-[38px] rounded-full bg-brand-orange font-normal">
            Agree
          </Button>
        </div>
      }
    >
      <h3 className="text-body-m font-semibold text-fg">{workspace.title}</h3>
      <ContractTerms numbered />
      {error && (
        <p role="alert" className="text-body-s text-error">
          {error}
        </p>
      )}
    </Modal>
  )
}
