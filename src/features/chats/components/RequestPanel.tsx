import { ArrowLeft, User } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar, IconButton, Spinner } from '@/components/ui'
import { getRoleLabel } from '@/features/auth/user'
import { getErrorMessage } from '@/lib/api/errors'
import { useCollaborationRequest } from '../hooks/queries'
import { useAnswerRequest } from '../hooks/useAnswerRequest'

/** "View request" in the chats right bar (Figma "right bar" / request view). */
export function RequestPanel({ requestId, onBack }: { requestId: string; onBack?: () => void }) {
  const request = useCollaborationRequest(requestId)
  const { answer, pending, accepting } = useAnswerRequest(request.data)

  if (request.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="text-brand-orange" />
      </div>
    )
  }
  if (request.isError) {
    return <p className="p-10 text-center text-body-m text-fg-muted">{getErrorMessage(request.error)}</p>
  }

  const { sender, project } = request.data
  const pendingRequest = request.data.status === 'pending'

  return (
    <section aria-label={`Collaboration request from ${sender.fullName}`} className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-hairline px-[18px] py-2.5">
        {onBack && (
          <IconButton label="Back to requests" onClick={onBack} className="size-10 bg-fg/5">
            <ArrowLeft className="size-6" />
          </IconButton>
        )}
        <div className="flex h-[37px] min-w-0 flex-1 items-center gap-2 sm:px-5">
          <Avatar src={sender.avatarUrl ?? undefined} name={sender.fullName} size={45} />
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-body-m font-semibold text-fg">{sender.fullName}</p>
            {project && <p className="truncate text-caption text-fg">{project.title}</p>}
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center px-5 pt-16 pb-10 sm:pt-[190px]">
        <div className="flex w-full max-w-[355px] flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center gap-3.5">
            <Avatar src={sender.avatarUrl ?? undefined} name={sender.fullName} size={128} />
            <div className="flex w-full flex-col items-center gap-3 text-center">
              <Link
                to={paths.person(sender.id)}
                className="flex h-[34px] items-center justify-center gap-1.5 rounded-full border-[0.3px] border-border-default bg-background p-2 text-body-s text-fg hover:bg-fg/5"
              >
                <User aria-hidden className="size-3.5" />
                View Profile
              </Link>
              <p className="flex flex-wrap items-baseline justify-center gap-2">
                <span className="text-body-l font-semibold text-fg">{sender.fullName}</span>
                <span className="text-body-m text-brand-orange">
                  {getRoleLabel({ role: sender.memberRole ?? undefined })}
                </span>
              </p>
              <p className="text-body-m text-fg">
                {project ? (
                  <>
                    invited you to join <span className="font-semibold">{project.title}</span>
                  </>
                ) : (
                  'wants to collaborate with you'
                )}
              </p>
              {request.data.message && (
                <p className="text-body-s break-words text-fg-muted">“{request.data.message}”</p>
              )}
            </div>
          </div>

          {pendingRequest ? (
            <div className="flex w-full flex-col gap-3.5">
              <button
                type="button"
                disabled={pending}
                onClick={() => answer(true)}
                className="flex h-[38px] w-full items-center justify-center rounded-full bg-brand-orange px-5 text-body-l text-white hover:brightness-95 disabled:opacity-70"
              >
                {accepting ? <Spinner className="size-4" /> : 'Accept Request'}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => answer(false)}
                className="flex h-[38px] w-full items-center justify-center rounded-full bg-brand-orange-tint px-5 text-body-l text-brand-orange hover:brightness-95 disabled:opacity-70"
              >
                Decline
              </button>
            </div>
          ) : (
            <p className="text-body-s text-fg-muted">This request was {request.data.status}.</p>
          )}
        </div>
      </div>
    </section>
  )
}
