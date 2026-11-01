import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, meApi, SESSION_EXPIRED_EVENT, tokens } from '@/lib/api'
import { local, session as sessionStore } from '@/lib/storage'
import { AuthContext, type AuthContextValue } from './authContext'
import type { PendingVerification, Session, User } from './types'
import { toUser } from './user'

const SESSION_KEY = 'communiti-session'
const PENDING_KEY = 'communiti-pending-verification'
const LAST_USER_KEY = 'communiti-last-user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(() => local.get<Session>(SESSION_KEY))
  const [pending, setPending] = useState<PendingVerification | null>(() =>
    sessionStore.get<PendingVerification>(PENDING_KEY),
  )
  const [lastUserName, setLastUserName] = useState<string | null>(() => local.get<string>(LAST_USER_KEY))

  const persistSession = useCallback((next: Session | null) => {
    setSession(next)
    local.set(SESSION_KEY, next)
    // The axios client sends this token on every member request.
    tokens.set('member', next?.token ?? null)
    if (next?.user.firstName) {
      setLastUserName(next.user.firstName)
      local.set(LAST_USER_KEY, next.user.firstName)
    }
  }, [])

  const startVerification = useCallback((next: PendingVerification) => {
    setPending(next)
    sessionStore.set(PENDING_KEY, next)
  }, [])

  const clearVerification = useCallback(() => {
    setPending(null)
    sessionStore.set(PENDING_KEY, null)
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

  const clearSession = useCallback(() => {
    persistSession(null)
    // Nothing cached for this member should be visible to the next one. The admin console signs in separately.
    queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== 'admin' })
  }, [persistSession, queryClient])

  const signOut = useCallback(async () => {
    // Tell the backend to end this device's session; sign out locally either way. Awaited
    // because the client reads the token after this tick, and clearing it first would drop it.
    if (tokens.get('member')) await authApi.logout().catch(() => undefined)
    clearSession()
  }, [clearSession])

  // The access token expired and could not be refreshed: back to the login screen.
  useEffect(() => {
    const onExpired = (event: Event) => (event as CustomEvent).detail === 'member' && clearSession()
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [clearSession])

  // Sign-in responses only carry the basics, and a stored session may be out of date (or no
  // longer valid, which ends it above), so load the full record once per session.
  const token = session?.token
  useEffect(() => {
    if (!token) return
    let stale = false
    meApi
      .getMe()
      .then((me) => {
        if (!stale) updateUser(toUser(me))
      })
      .catch(() => undefined)
    return () => {
      stale = true
    }
  }, [token, updateUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      pending,
      lastUserName,
      startVerification,
      clearVerification,
      signIn,
      updateUser,
      signOut,
    }),
    [session, pending, lastUserName, startVerification, clearVerification, signIn, updateUser, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
