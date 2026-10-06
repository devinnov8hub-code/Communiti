import { local } from '@/lib/storage'

export const TOKEN_STORAGE_KEY = 'communiti-token'

/** The member app and the admin console sign in separately and keep separate access tokens. */
export type AuthScope = 'member' | 'admin'

const KEYS: Record<AuthScope, string> = {
  member: TOKEN_STORAGE_KEY,
  admin: 'communiti-admin-token',
}

/** Fired on `window` when a session can't be refreshed; `detail` is the scope that expired. */
export const SESSION_EXPIRED_EVENT = 'communiti:session-expired'

/** Access-token storage. Refresh tokens never reach JavaScript — the backend keeps them in an httpOnly cookie. */
export const tokens = {
  get: (scope: AuthScope) => local.get<string>(KEYS[scope]),
  set: (scope: AuthScope, token: string | null) => local.set(KEYS[scope], token),
}
