import type { Me, TokenResponse } from '@/lib/api'
import type { AdminSession, AdminUser } from '../types'

/** The console's admin record from a backend user (sign-in response or GET /me). */
export function toAdminUser(
  user: Pick<Me, 'id' | 'fullName' | 'email' | 'avatarUrl'> & { phone?: string | null },
): AdminUser {
  // The backend has one `fullName`; the profile screen shows first and last name separately.
  const [firstName = '', ...rest] = user.fullName.trim().split(/\s+/)
  return {
    id: user.id,
    firstName,
    lastName: rest.join(' '),
    email: user.email,
    phone: user.phone ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
  }
}

/** Turns the backend's sign-in response into the admin session the console keeps. */
export function toAdminSession({ accessToken, user }: TokenResponse): AdminSession {
  return { token: accessToken, admin: toAdminUser(user) }
}
