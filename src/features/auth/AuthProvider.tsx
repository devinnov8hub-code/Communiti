import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { TOKEN_STORAGE_KEY } from '@/lib/api/client'
import { local, session as sessionStore } from '@/lib/storage'
import { AuthContext, type AuthContextValue } from './authContext'
import type { PendingVerification, Session, User } from './types'

const SESSION_KEY = 'communiti-session'
const PENDING_KEY = 'communiti-pending-verification'
const LAST_USER_KEY = 'communiti-last-user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => local.get<Session>(SESSION_KEY))
  const [pending, setPending] = useState<PendingVerification | null>(() =>
    sessionStore.get<PendingVerification>(PENDING_KEY),
  )
  const [lastUserName, setLastUserName] = useState<string | null>(() => local.get<string>(LAST_USER_KEY))

  const persistSession = useCallback((next: Session | null) => {
    setSession(next)
    local.set(SESSION_KEY, next)
    local.set(TOKEN_STORAGE_KEY, next?.token ?? null)
    if (next?.user.firstName) {
      setLastUserName(next.user.firstName)
      local.set(LAST_USER_KEY, next.user.firstName)
    }
  }, [])

  const startVerification = useCallback((next: PendingVerification) => {
    setPending(next)
    sessionStore.set(PENDING_KEY, next)
  }, [])

  const signIn = useCallback(
    (next: Session) => {
      persistSession(next)
      setPending(null)
      sessionStore.set(PENDING_KEY, null)
    },
    [persistSession],
  )

  const updateUser = useCallback(
    (user: User) =>
      setSession((current) => {
        if (!current) return current
        const next = { ...current, user }
        local.set(SESSION_KEY, next)
        return next
      }),
    [],
  )

  const signOut = useCallback(() => persistSession(null), [persistSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      pending,
      lastUserName,
      startVerification,
      signIn,
      updateUser,
      signOut,
    }),
    [session, pending, lastUserName, startVerification, signIn, updateUser, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
