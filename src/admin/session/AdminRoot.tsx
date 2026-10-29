import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { adminPaths } from '../paths'
import { api, SESSION_EXPIRED_EVENT, tokens } from '@/lib/api'
import { local, session as tabStorage } from '@/lib/storage'
import type { AdminSession, AdminUser } from '../types'
import { AdminSessionContext, useAdminSession, type ResetFlow } from './adminSessionContext'

/** Where the signed-in admin is remembered (the token itself is kept by `tokens`). */
export const ADMIN_SESSION_KEY = 'communiti-admin-session'
const RESET_KEY = 'communiti-admin-reset'

/** Layout route for everything under /admin: provides the admin session (separate from members). */
export function AdminRoot() {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(() => local.get<AdminSession>(ADMIN_SESSION_KEY))
  const [reset, setResetState] = useState(() => tabStorage.get<ResetFlow>(RESET_KEY))

  const signIn = useCallback((next: AdminSession) => {
    // The axios client sends this token on every admin request (scope: 'admin').
    tokens.set('admin', next.token)
    local.set(ADMIN_SESSION_KEY, next)
    setSession(next)
  }, [])

  const updateAdmin = useCallback((admin: AdminUser) => {
    setSession((current) => {
      if (!current) return current
      const next = { ...current, admin }
      local.set(ADMIN_SESSION_KEY, next)
      return next
    })
  }, [])

  const clearSession = useCallback(() => {
    tokens.set('admin', null)
    local.set(ADMIN_SESSION_KEY, null)
    setSession(null)
    queryClient.removeQueries({ queryKey: ['admin'] })
  }, [queryClient])

  const signOut = useCallback(() => {
    // Tell the backend to end this device's session; sign out locally either way.
    if (tokens.get('admin')) {
      api.post('/api/v1/auth/logout', undefined, { scope: 'admin', skipRefresh: true }).catch(() => undefined)
    }
    clearSession()
  }, [clearSession])

  // The access token expired and could not be refreshed: back to the login screen.
  useEffect(() => {
    const onExpired = (event: Event) => (event as CustomEvent).detail === 'admin' && clearSession()
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [clearSession])

  const setReset = useCallback((next: ResetFlow | null) => {
    tabStorage.set(RESET_KEY, next)
    setResetState(next)
  }, [])

  const value = useMemo(
    () => ({ session, admin: session?.admin ?? null, signIn, updateAdmin, signOut, reset, setReset }),
    [session, signIn, updateAdmin, signOut, reset, setReset],
  )

  return (
    <AdminSessionContext.Provider value={value}>
      <Outlet />
    </AdminSessionContext.Provider>
  )
}

/** Admin sign-in screens — bounce signed-in admins to the dashboard. */
export function AdminGuestOnly() {
  const { admin } = useAdminSession()
  return admin ? <Navigate to={adminPaths.overview} replace /> : <Outlet />
}

/** Dashboard screens — require an admin session. */
export function RequireAdmin() {
  const { admin } = useAdminSession()
  return admin ? <Outlet /> : <Navigate to={adminPaths.login} replace />
}
