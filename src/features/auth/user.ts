import type { AuthUser, Me, TokenResponse } from '@/lib/api'
import { ROLE_OPTIONS } from './constants'
import type { Session, User } from './types'

/** The app's user from a backend one: a sign-in response, or GET /me (which adds the profile fields). */
export function toUser(user: AuthUser & Partial<Pick<Me, 'dateOfBirth' | 'country' | 'interests'>>): User {
  // The backend has one `fullName`; the app shows first and last name separately.
  const [firstName, ...rest] = user.fullName.trim().split(/\s+/)
  return {
    id: user.id,
    email: user.email,
    firstName: firstName || undefined,
    lastName: rest.join(' ') || undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.memberRole ?? undefined,
    dateOfBirth: user.dateOfBirth ?? undefined,
    country: user.country ?? undefined,
    interests: user.interests?.map((topic) => topic.id) ?? [],
    onboardingComplete: user.onboardingComplete,
  }
}

/** Turns the backend's sign-in response into the session the app keeps. */
export function toSession({ accessToken, user }: TokenResponse): Session {
  return { token: accessToken, user: toUser(user) }
}

/** "Terry Jameson", falling back to the email's local part. */
export function getDisplayName(user: Pick<User, 'firstName' | 'lastName' | 'email'>) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email.split('@')[0]
}

/** "Expert", "Researcher"… */
export function getRoleLabel(user: Pick<User, 'role'>) {
  return ROLE_OPTIONS.find((option) => option.value === user.role)?.label ?? 'Member'
}
