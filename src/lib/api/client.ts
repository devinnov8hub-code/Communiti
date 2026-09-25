import { local } from '@/lib/storage'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/** When no backend URL is configured, services fall back to local mocks. */
export const USE_MOCK_API = API_BASE_URL === ''

export const TOKEN_STORAGE_KEY = 'communiti-token'

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export async function apiRequest<T>(path: string, { body, headers, ...init }: RequestOptions = {}): Promise<T> {
  const token = local.get<string>(TOKEN_STORAGE_KEY)
  const isForm = body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && !isForm && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    const message = (data as { message?: string } | null)?.message ?? 'Something went wrong. Please try again.'
    throw new ApiError(message, response.status, data)
  }

  return data as T
}

/** Normalises any thrown value into a user-facing message. */
export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
