import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { adminPaths } from '../paths'
import { local, session as tabStorage } from '@/lib/storage'
import { ADMIN_SESSION_KEY } from '../api/admin.service'
import type { AdminSession, AdminUser } from '../types'
import { AdminSessionContext, useAdminSession, type ResetFlow } from './adminSessionContext'

const RESET_KEY = 'communiti-admin-reset'

/** Layout route for everything under /admin: provides the admin session (separate from members). */
export function AdminRoot() {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(() => local.get<AdminSession>(ADMIN_SESSION_KEY))
  const [reset, setResetState] = useState(() => tabStorage.get<ResetFlow>(RESET_KEY))

  const signIn = useCallback((next: AdminSession) => {
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

  const signOut = useCallback(() => {
    local.set(ADMIN_SESSION_KEY, null)
    setSession(null)
    queryClient.removeQueries({ queryKey: ['admin'] })
  }, [queryClient])

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
