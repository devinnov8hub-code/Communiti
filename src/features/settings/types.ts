import type { UserRole } from '@/features/auth/types'

export type MessagePermission = 'no-one' | 'collaborators' | 'followers' | 'anyone'
export type CollaborationPermission = 'no-one' | 'everyone' | 'followers'
export type LanguageCode = 'en' | 'fr' | 'ha' | 'yo' | 'ig'

export interface AccountSettings {
  email: string
  /** YYYY-MM-DD */
  dateOfBirth: string
  country: string
  city: string
  education: string
  role: UserRole
  profession: string
}

export interface VisibilitySettings {
  messages: MessagePermission
  collaborationRequests: CollaborationPermission
}

export const DELETE_REASONS = [
  'I am no longer using my account',
  "I couldn't find the features I needed",
  'I have privacy or security concerns',
  'The platform did not meet my expectations',
] as const
export type DeleteReason = (typeof DELETE_REASONS)[number]
