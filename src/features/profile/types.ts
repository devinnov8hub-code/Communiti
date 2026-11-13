import type { UserRole } from '@/features/auth/types'

/**
 * The signed-in member's own profile, from `GET /me`.
 *
 * The Figma "Profile About" also has Skills and Work Experience. The backend has no fields or
 * endpoints for them, so they are hidden until it does (see README → Profile).
 */
export interface Profile {
  id: string
  name: string
  /** Changed only through the verified role screens (Settings → Account Preferences). */
  role?: UserRole
  /** The backend's `headline`, e.g. "Fishery Engineer". */
  profession: string
  bio: string
  location?: string
  avatarUrl?: string
  coverUrl?: string
  collaborations: number
  following: number
  followers: number
  postsCount: number
  openToCollaborations: boolean
}

/** What Edit Profile saves. A new photo is uploaded first and saved as `avatarUrl`. */
export interface ProfileUpdate {
  name?: string
  profession?: string
  avatar?: File
}
