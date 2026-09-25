import { ROLE_OPTIONS } from './constants'
import type { User } from './types'

/** "Terry Jameson", falling back to the email's local part. */
export function getDisplayName(user: Pick<User, 'firstName' | 'lastName' | 'email'>) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email.split('@')[0]
}

/** "Expert", "Researcher"… */
export function getRoleLabel(user: Pick<User, 'role'>) {
  return ROLE_OPTIONS.find((option) => option.value === user.role)?.label ?? 'Member'
}
