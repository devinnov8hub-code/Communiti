import { ReportDialog, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { useReportPost } from '../hooks/queries'
import { REPORT_REASONS } from '../types'

interface ReportPostModalProps {
  postId: string | null
  onClose: () => void
}

/** "Report Post" dialog — pick one or more reasons, then submit. */
export function ReportPostModal({ postId, onClose }: ReportPostModalProps) {
  const report = useReportPost()
  const toast = useToast()

  const close = () => {
    report.reset()
    onClose()
  }

  return (
    <ReportDialog
      open={postId !== null}
      onClose={close}
      title="Report Post"
      prompt="What’s wrong with this post? Choose the most relevant reason."
      reasons={REPORT_REASONS}
      submitLabel="Report this Post"
      loading={report.isPending}
      error={report.isError ? getErrorMessage(report.error) : undefined}
      onSubmit={(reasons) =>
        postId &&
        report.mutate(
          { id: postId, reasons },
          {
            onSuccess: () => {
              toast('Thanks — our moderators will review this post')
              close()
            },
          },
        )
      }
    />
  )
}
