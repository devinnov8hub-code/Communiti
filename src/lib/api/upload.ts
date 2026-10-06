import axios from 'axios'
import { ApiError } from './errors'
import * as uploadsApi from './services/uploads.service'
import type { PresignUploadBody } from './types/uploads.types'

export interface UploadedFile {
  /** Use in posts, messages and workspace items. */
  mediaId: string
  /** Set for public files (avatar, cover, post images). */
  publicUrl: string | null
}

/**
 * Uploads a file the way the backend expects: presign → PUT the bytes straight to
 * storage → confirm. Returns the `mediaId` to reference from other requests.
 */
export async function uploadFile(
  file: File,
  purpose: PresignUploadBody['purpose'],
  meta: Pick<PresignUploadBody, 'width' | 'height' | 'durationSeconds'> = {},
): Promise<UploadedFile> {
  const mimeType = file.type || 'application/octet-stream'
  const presigned = await uploadsApi.presignUpload({
    purpose,
    mimeType,
    sizeBytes: file.size,
    fileName: file.name.slice(0, 200),
    ...meta,
  })
  // Straight to storage, not through our API instance (no auth header or cookies).
  await axios.put(presigned.uploadUrl, file, { headers: { 'Content-Type': mimeType } }).catch((error) => {
    throw new ApiError(
      'The upload failed. Please try again.',
      axios.isAxiosError(error) ? (error.response?.status ?? 0) : 0,
    )
  })
  await uploadsApi.completeUpload(presigned.mediaId)
  return { mediaId: presigned.mediaId, publicUrl: presigned.publicUrl }
}
