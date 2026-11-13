import type { Settings } from '@/lib/api'

/** "Who can message me" — the backend's `messagePermission`. */
export type MessagePermission = Settings['messagePermission']

export type LanguageCode = 'en' | 'fr' | 'ha' | 'yo' | 'ig'

export const DELETE_REASONS = [
  'I am no longer using my account',
  "I couldn't find the features I needed",
  'I have privacy or security concerns',
  'The platform did not meet my expectations',
] as const
export type DeleteReason = (typeof DELETE_REASONS)[number]
