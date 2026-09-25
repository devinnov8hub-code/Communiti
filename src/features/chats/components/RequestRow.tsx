import { useState } from 'react'
import { Avatar, Button, Modal, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { useRespondToRequest } from '../hooks/queries'
import type { CollaborationRequest } from '../types'

/** Collaboration request with Decline / View request actions. */
export function RequestRow({ request }: { request: CollaborationRequest }) {
  const [open, setOpen] = useState(false)
  const respond = useRespondToRequest()
  const toast = useToast()

  const answer = (accept: boolean) =>
    respond.mutate(
      { id: request.id, accept },
      {
        onSuccess: () => {
          setOpen(false)
          toast(accept ? `You joined ${request.projectTitle}` : 'Request declined')
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )

  return (
    <li className="border-b border-hairline py-2">
      <div className="flex flex-col gap-3 px-1.5 py-[3px]">
        <div className="flex items-center gap-1">
          <Avatar src={request.avatarUrl} name={request.fromName} size={45} />
          <div className="flex max-w-[230px] min-w-0 flex-col gap-[3px]">
            <p className="text-body-s text-fg">{request.fromName}</p>
            <p className="text-caption text-fg-muted">{request.message}</p>
          </div>
        </div>
        <div className="flex h-[47px] items-center justify-end gap-[11px]">
          <button
            type="button"
            disabled={respond.isPending}
            onClick={() => answer(false)}
            className="w-[75px] rounded-full bg-surface p-2 text-caption text-brand-orange hover:bg-brand-orange-tint disabled:opacity-60"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-brand-orange p-2 text-caption text-white hover:brightness-95"
          >
            View request
          </button>
        </div>
      </div>

      {open && (
        <Modal open onClose={() => setOpen(false)} title="Collaboration request" className="max-w-[480px]">
          <div className="flex items-center gap-3">
            <Avatar src={request.avatarUrl} name={request.fromName} size={58} />
            <div>
              <p className="text-body-l font-semibold text-fg">{request.fromName}</p>
              <p className="text-body-s text-fg-muted">Project: {request.projectTitle}</p>
            </div>
          </div>
          <p className="text-body-m text-fg">{request.message}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-[38px] rounded-full text-body-m"
              disabled={respond.isPending}
              onClick={() => answer(false)}
            >
              Decline
            </Button>
            <Button
              className="h-[38px] rounded-full bg-brand-orange text-body-m"
              loading={respond.isPending}
              onClick={() => answer(true)}
            >
              Accept
            </Button>
          </div>
        </Modal>
      )}
    </li>
  )
}
