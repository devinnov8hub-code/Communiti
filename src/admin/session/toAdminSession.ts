import type { TokenResponse } from '@/lib/api'
import type { AdminSession } from '../types'

/** Turns the backend's sign-in response into the admin session the console keeps. */
export function toAdminSession({ accessToken, user }: TokenResponse): AdminSession {
  // The backend has one `fullName`; the profile screen shows first and last name separately.
  const [firstName = '', ...rest] = user.fullName.trim().split(/\s+/)
  return {
    token: accessToken,
    admin: {
      id: user.id,
      firstName,
      lastName: rest.join(' '),
      email: user.email,
      avatarUrl: user.avatarUrl ?? undefined,
    },
  }
}
