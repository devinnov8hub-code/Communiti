import { ReportDialog, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { useReport } from '../hooks/queries'
import { REPORT_REASONS } from '../types'

const TARGETS = {
  post: { noun: 'Post', prompt: 'this post' },
  user: { noun: 'User', prompt: 'this account' },
  project: { noun: 'Project', prompt: 'this project' },
} as const

interface ReportModalProps {
  target: keyof typeof TARGETS
  targetId: string
  onClose: () => void
}

/** "Report Post" (and user / project) dialog — pick one or more reasons, then submit. */
export function ReportModal({ target, targetId, onClose }: ReportModalProps) {
  const report = useReport(target)
  const toast = useToast()
  const { noun, prompt } = TARGETS[target]

  const close = () => {
    report.reset()
    onClose()
  }

  return (
    <ReportDialog
      open
      onClose={close}
      title={`Report ${noun}`}
      prompt={`What’s wrong with ${prompt}? Choose the most relevant reason.`}
      reasons={REPORT_REASONS}
      submitLabel={`Report this ${noun}`}
      loading={report.isPending}
      error={report.isError ? getErrorMessage(report.error) : undefined}
      onSubmit={(reasons) =>
        report.mutate(
          { id: targetId, reasons },
          {
            onSuccess: () => {
              toast(`Thanks — our moderators will review ${prompt}`)
              close()
            },
          },
        )
      }
    />
  )
}
