import axios, { AxiosError, type AxiosResponse } from 'axios'
import { ApiError, toApiError } from './errors'
import { SESSION_EXPIRED_EVENT, tokens, type AuthScope } from './tokens'

/**
 * Backend origin (paths already include `/api/v1`). In development it is this app's own
 * origin: Vite proxies `/api` to the backend (vite.config.ts), because the backend only
 * accepts cross-origin calls from the production site.
 */
export const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? window.location.origin : 'https://api.mycommuniti.org')
).replace(/\/$/, '')

// Extra per-request options understood by the interceptors below.
declare module 'axios' {
  interface AxiosRequestConfig {
    /** Which access token to send: the member app's (default) or the admin console's. */
    scope?: AuthScope
    /** Public endpoint: don't send an Authorization header. */
    skipAuth?: boolean
    /** Don't refresh-and-retry on 401 (sign-in endpoints). */
    skipRefresh?: boolean
    /** Set once a request has been retried after a token refresh. */
    retried?: boolean
  }
}

/** Optional last argument of member services, e.g. `{ scope: 'admin' }` to call them as the admin. */
export interface CallOptions {
  scope?: AuthScope
}

/** The axios instance every service in `./services` uses. */
export const api = axios.create({
  baseURL: API_ORIGIN,
  // The refresh token lives in an httpOnly cookie, so cookies must travel with every call.
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

/** `api.get<T>(...).then(unwrap)` — services return the response body, not the axios response. */
export const unwrap = <T>(response: AxiosResponse<T>) => response.data

/** Tells the backend which app is calling; it decides how the refresh token comes back. */
const clientName = (scope: AuthScope = 'member') => (scope === 'admin' ? 'admin' : 'web')

api.interceptors.request.use((config) => {
  config.headers.set('X-Client', clientName(config.scope))
  const token = config.skipAuth ? null : tokens.get(config.scope ?? 'member')
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

// One refresh at a time per scope: parallel 401s share the same call (the refresh token rotates).
const refreshing: Partial<Record<AuthScope, Promise<boolean>>> = {}

function refreshAccessToken(scope: AuthScope) {
  refreshing[scope] ??= axios
    .post<{ accessToken?: string }>(
      `${API_ORIGIN}/api/v1/auth/refresh`,
      {},
      { withCredentials: true, headers: { 'X-Client': clientName(scope) } },
    )
    .then(({ data }) => {
      if (!data.accessToken) return false
      tokens.set(scope, data.accessToken)
      return true
    })
    .catch(() => false)
    .finally(() => {
      delete refreshing[scope]
    })
  return refreshing[scope]
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) throw error
    const { config, response } = error
    if (!response) throw new ApiError('Could not reach the server. Check your connection and try again.', 0)

    // Access tokens last 15 minutes: refresh once, then repeat the original request.
    const scope = config?.scope ?? 'member'
    if (response.status === 401 && config && !config.skipAuth && !config.skipRefresh && !config.retried) {
      if (tokens.get(scope) && (await refreshAccessToken(scope))) return api.request({ ...config, retried: true })
      tokens.set(scope, null)
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: scope }))
    }
    // Development only: print what the backend actually said, so server errors are easy to report.
    if (import.meta.env.DEV && response.status >= 500) {
      console.error(
        `[api] ${response.status} ${config?.method?.toUpperCase()} ${config?.url}`,
        '\nBackend response:',
        response.data,
        '\nrequestId:',
        (response.data as { error?: { requestId?: string } } | undefined)?.error?.requestId ?? 'none',
      )
    }
    // Carries the backend's `code`, `fields` and `requestId`.
    throw toApiError(response.status, response.data)
  },
)
