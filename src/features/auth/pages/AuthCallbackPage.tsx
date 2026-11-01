import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Spinner, useToast } from '@/components/ui'
import { authApi } from '@/lib/api'
import { useAuth } from '../hooks/useAuth'
import { toSession } from '../user'

/** Back from Google: the backend has set the refresh cookie, which we exchange for a session. */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { signIn } = useAuth()
  const [params] = useSearchParams()
  const started = useRef(false)

  useEffect(() => {
    // The refresh token rotates on every call, so StrictMode's second run must not repeat it.
    if (started.current) return
    started.current = true

    const failed = () => {
      toast(params.get('message') ?? 'Google sign-in didn’t work. Please try again.')
      navigate(paths.login, { replace: true })
    }
    if (params.has('error')) return failed()

    authApi
      .refresh({})
      .then((response) => {
        const session = toSession(response)
        signIn(session)
        navigate(session.user.onboardingComplete ? paths.home : paths.onboardingRole, { replace: true })
      })
      .catch(failed)
  }, [navigate, params, signIn, toast])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-fg">
      <Spinner className="size-8" />
    </div>
  )
}
