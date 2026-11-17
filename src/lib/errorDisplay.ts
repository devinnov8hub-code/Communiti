import { ApiError } from '@/lib/api/errors'

/** What went wrong, from the member's point of view. Picks the icon and the wording. */
export type ErrorKind = 'offline' | 'notFound' | 'forbidden' | 'session' | 'busy' | 'server' | 'update' | 'unknown'

export interface ErrorDisplay {
  kind: ErrorKind
  title: string
  message: string
  /** The backend's request id on server errors, so support can find the log line. */
  reference?: string
}

// A lazy screen that no longer exists on the server: the app was redeployed while this tab was open.
const STALE_BUNDLE = /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i
export const isStaleBundleError = (error: unknown) => error instanceof Error && STALE_BUNDLE.test(error.message)

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

// The backend's generic 403 says nothing useful; specific ones ("This account is suspended") do.
const GENERIC_FORBIDDEN = 'You do not have permission to do this'

/**
 * Turns any thrown value into friendly copy. Server and network failures never show their raw
 * text ("Request failed with status code 502"); messages the backend wrote for people (a 403's
 * reason, a 409's conflict) are kept.
 */
export function describeError(error: unknown): ErrorDisplay {
  if (isStaleBundleError(error)) {
    return {
      kind: 'update',
      title: 'A new version is available',
      message: 'CommUniti was just updated. Reload the page to get the latest version.',
    }
  }
  if (isOffline() || (error instanceof ApiError && error.status === 0)) {
    return {
      kind: 'offline',
      title: 'You’re offline',
      message: 'We couldn’t reach CommUniti. Check your internet connection and try again.',
    }
  }
  if (error instanceof ApiError) {
    const { status, message, requestId } = error
    if (status === 404) {
      return {
        kind: 'notFound',
        title: 'We couldn’t find that',
        message: 'It may have been removed, or the link may be wrong.',
      }
    }
    if (status === 401) {
      return { kind: 'session', title: 'Your session has ended', message: 'Sign in again to continue.' }
    }
    if (status === 403) {
      return {
        kind: 'forbidden',
        title: 'You don’t have access',
        message: message && message !== GENERIC_FORBIDDEN ? message : 'You don’t have permission to view this.',
      }
    }
    if (status === 429) {
      return {
        kind: 'busy',
        title: 'Slow down a little',
        message: 'Too many requests in a short time. Wait a moment, then try again.',
      }
    }
    if (status >= 500) {
      return {
        kind: 'server',
        title: 'Something went wrong on our side',
        message: 'It’s not you. Please try again in a moment.',
        reference: requestId,
      }
    }
    return { kind: 'unknown', title: 'Something went wrong', message }
  }
  return {
    kind: 'unknown',
    title: 'Something went wrong',
    message: 'An unexpected error stopped this from loading. Please try again.',
  }
}
