/**
 * Everything that talks to the CommUniti backend (https://api.mycommuniti.org/api/docs).
 *
 *   import { postsApi, type Post } from '@/lib/api'
 *   const { data, nextCursor } = await postsApi.getFeed({ tab: 'for-you' })
 *
 *   client.ts   the axios instance: auth token, refresh on 401, error handling
 *   services/   one `<area>.service.ts` per API area — a function per endpoint
 *   types/      types for every model, request body, query and response
 *   errors.ts   ApiError and getErrorMessage
 *   upload.ts   uploadFile(file, purpose)
 *
 * services/ and types/ are generated from the backend's OpenAPI spec by
 * `npm run api:sync` — don't edit them by hand.
 */
export * from './services'
export type * from './types'
export { api, API_ORIGIN, type CallOptions } from './client'
export { ApiError, getErrorMessage, type ApiFieldErrors } from './errors'
export { SESSION_EXPIRED_EVENT, tokens, type AuthScope } from './tokens'
export { uploadFile, type UploadedFile } from './upload'
