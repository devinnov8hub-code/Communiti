import { createContext } from 'react'
import type { PendingVerification, Session, User } from './types'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  isAuthenticated: boolean
  /** Email + flow awaiting a verification code (kept for the current tab only). */
  pending: PendingVerification | null
  /** First name of the last user who signed in on this device ("Welcome back Demilade"). */
  lastUserName: string | null
  startVerification: (pending: PendingVerification) => void
  /** Forget the pending code (e.g. after a password reset finishes). */
  clearVerification: () => void
  signIn: (session: Session) => void
  updateUser: (user: User) => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
