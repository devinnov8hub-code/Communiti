import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi } from '../api/auth.service'
import { useAuth } from './useAuth'

/** "Continue with Google" — shared by Create account and Login. */
export function useGoogleSignIn() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  return useAsyncAction(async () => {
    const session = await authApi.continueWithGoogle()
    // With a real backend the browser has already been redirected to Google.
    if (!session) return
    signIn(session)
    navigate(session.user.onboardingComplete ? paths.home : paths.onboardingProfile, { replace: true })
  })
}
