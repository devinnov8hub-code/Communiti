import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { paths } from './paths'

/** Only for signed-out visitors (login, sign-up, verification). */
export function GuestOnly() {
  const { user } = useAuth()
  if (user) return <Navigate to={user.onboardingComplete ? paths.home : paths.onboardingProfile} replace />
  return <Outlet />
}

/** Signed in but still completing onboarding. */
export function OnboardingOnly() {
  const { user } = useAuth()
  if (!user) return <Navigate to={paths.login} replace />
  if (user.onboardingComplete) return <Navigate to={paths.home} replace />
  return <Outlet />
}

/** The main app — requires a session and completed onboarding. */
export function RequireAuth() {
  const { user } = useAuth()
  if (!user) return <Navigate to={paths.login} replace />
  if (!user.onboardingComplete) return <Navigate to={paths.onboardingProfile} replace />
  return <Outlet />
}
