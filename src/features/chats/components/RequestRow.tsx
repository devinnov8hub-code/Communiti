import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar } from '@/components/ui'
import type { CollaborationRequest } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useAnswerRequest } from '../hooks/useAnswerRequest'

/** Collaboration request with Decline / View request actions (Figma "message", request variant). */
export function RequestRow({ request, active }: { request: CollaborationRequest; active: boolean }) {
  const { answer, pending } = useAnswerRequest(request)
  const { sender, project } = request
  const message = request.message || `${sender.fullName} would like to collaborate with you`

  return (
    <li className="border-b border-hairline py-2">
      <div
        className={cn(
          'flex flex-col gap-3 rounded-control px-1.5 py-[3px]',
          active && 'bg-brand-orange-tint/60 dark:bg-grey-50',
        )}
      >
        <div className="flex items-center gap-1">
          <Avatar src={sender.avatarUrl ?? undefined} name={sender.fullName} size={45} />
          <div className="flex max-w-[230px] min-w-0 flex-col gap-[3px]">
            <p className="text-body-s text-fg">{project?.title ?? sender.fullName}</p>
            <p className="line-clamp-2 text-caption text-fg-muted">{message}</p>
          </div>
        </div>
        <div className="flex h-[47px] items-center justify-end gap-[11px]">
          <button
            type="button"
            disabled={pending}
            onClick={() => answer(false)}
            className="w-[75px] rounded-full bg-surface p-2 text-caption text-brand-orange hover:bg-brand-orange-tint disabled:opacity-60"
          >
            Decline
          </button>
          <Link
            to={paths.chatRequest(request.id)}
            aria-current={active ? 'page' : undefined}
            className="rounded-full bg-brand-orange p-2 text-caption text-white hover:brightness-95"
          >
            View request
          </Link>
        </div>
      </div>
    </li>
  )
}
