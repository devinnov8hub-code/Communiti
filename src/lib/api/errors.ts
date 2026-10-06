/** Field-level validation messages from the backend, keyed by field name. */
export type ApiFieldErrors = Record<string, string | string[]>

export interface ApiErrorInfo {
  /** Machine-readable code, e.g. `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`. */
  code?: string
  fields?: ApiFieldErrors
  requestId?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown
  readonly code?: string
  readonly fields?: ApiFieldErrors
  readonly requestId?: string

  constructor(message: string, status: number, details?: unknown, info: ApiErrorInfo = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.code = info.code
    this.fields = info.fields
    this.requestId = info.requestId
  }
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

/**
 * Builds an ApiError from a failed response body. The backend sends
 * `{ error: { code, message, fields?, requestId } }`; plain `{ message }` is accepted too.
 */
export function toApiError(status: number, data: unknown): ApiError {
  const body = (data ?? {}) as { message?: string; error?: ApiErrorInfo & { message?: string } }
  const error = body.error
  return new ApiError(error?.message ?? body.message ?? FALLBACK_MESSAGE, status, data, {
    code: error?.code,
    fields: error?.fields,
    requestId: error?.requestId,
  })
}

/** Normalises any thrown value into a user-facing message. */
export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return FALLBACK_MESSAGE
}
