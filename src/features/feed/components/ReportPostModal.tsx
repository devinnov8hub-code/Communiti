import { Check } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Modal, useToast } from '@/components/ui'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/api/client'
import { useReportPost } from '../hooks/queries'
import { REPORT_REASONS, type ReportReason } from '../types'

interface ReportPostModalProps {
  postId: string | null
  onClose: () => void
}

/** "Report Post" dialog — pick one or more reasons, then submit. */
export function ReportPostModal({ postId, onClose }: ReportPostModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([])
  const report = useReportPost()
  const toast = useToast()

  const close = () => {
    setReasons([])
    report.reset()
    onClose()
  }

  const toggle = (reason: ReportReason) =>
    setReasons((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason],
    )

  const submit = () => {
    if (!postId || reasons.length === 0) return
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

  return (
    <Modal open={postId !== null} onClose={close} title="Report Post">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-body-m text-fg-muted">
          What’s wrong with this post? Choose the most relevant reason.
        </legend>
        {REPORT_REASONS.map((reason) => {
          const checked = reasons.includes(reason)
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

      {report.isError && (
        <p role="alert" className="text-body-s text-error">
          {getErrorMessage(report.error)}
        </p>
      )}

      <Button
        onClick={submit}
        disabled={reasons.length === 0}
        loading={report.isPending}
        className="mt-5 mb-2 h-[38px] rounded-full bg-danger-soft font-normal"
      >
        Report this Post
      </Button>
    </Modal>
  )
}
