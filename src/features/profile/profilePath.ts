import { paths } from '@/app/paths'
import { useAuth } from '@/features/auth/hooks/useAuth'

/** Where a person's name or avatar links to: my own profile, or theirs. */
export function useProfilePath() {
  const { user } = useAuth()
  return (userId: string) => (userId === user?.id ? paths.profile : paths.person(userId))
}
