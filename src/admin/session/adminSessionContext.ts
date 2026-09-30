import { createContext, useContext } from 'react'
import type { AdminSession, AdminUser } from '../types'

/** Password-reset progress, kept for the current tab only. */
export interface ResetFlow {
  email: string
  resetToken?: string
}

export interface AdminSessionValue {
  session: AdminSession | null
  admin: AdminUser | null
  signIn: (session: AdminSession) => void
  updateAdmin: (admin: AdminUser) => void
  signOut: () => void
  reset: ResetFlow | null
  setReset: (reset: ResetFlow | null) => void
}

export const AdminSessionContext = createContext<AdminSessionValue | null>(null)

export function useAdminSession() {
  const context = useContext(AdminSessionContext)
  if (!context) throw new Error('useAdminSession must be used inside the admin routes')
  return context
}
