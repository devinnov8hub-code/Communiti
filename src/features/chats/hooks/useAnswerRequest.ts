import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { useToast } from '@/components/ui'
import type { CollaborationRequest } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { useRespondToRequest } from './queries'

/** Accept or decline a request; accepting opens the new chat. */
export function useAnswerRequest(request: CollaborationRequest | undefined) {
  const respond = useRespondToRequest()
  const navigate = useNavigate()
  const toast = useToast()

  const answer = (accept: boolean) =>
    request &&
    respond.mutate(
      { id: request.id, accept },
      {
        onSuccess: (result) => {
          if (!accept) {
            toast('Request declined')
            return navigate(paths.chats, { replace: true, state: { view: 'requests' } })
          }
          toast(
            request.project
              ? `You joined ${request.project.title}`
              : `You’re now collaborating with ${request.sender.fullName}`,
          )
          navigate(result.conversationId ? paths.chat(result.conversationId) : paths.chats, { replace: true })
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )

  return { answer, pending: respond.isPending, accepting: respond.isPending && respond.variables?.accept }
}
