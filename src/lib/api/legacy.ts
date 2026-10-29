import { local } from '@/lib/storage'
import { toApiError } from './errors'
import { TOKEN_STORAGE_KEY } from './tokens'

/**
 * TEMPORARY — the fetch helper and sample-data switch used by feature services that are
 * not connected to the real backend yet (each feature's own api folder). Each one is
 * deleted as its feature moves to the axios services in ./services; then this file goes too.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/** When no backend URL is configured, the unconnected feature services use sample data. */
export const USE_MOCK_API = API_BASE_URL === ''

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

  if (!response.ok) throw toApiError(response.status, data)

  return data as T
}
