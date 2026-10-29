export type UserRole = 'artisan' | 'expert' | 'researcher'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  role?: UserRole
  /** ISO date, YYYY-MM-DD */
  dateOfBirth?: string
  /** ISO 3166-1 alpha-2 country code */
  country?: string
  interests: string[]
  onboardingComplete: boolean
}

export interface Session {
  token: string
  user: User
}

/** Which flow a verification code was requested for. */
export type VerificationFlow = 'signup' | 'reset'

export interface PendingVerification {
  email: string
  flow: VerificationFlow
  /** Password reset: set once the emailed code is confirmed. */
  resetToken?: string
}

export interface SignUpDetails {
  fullName: string
  email: string
  location: string
  password: string
}

export interface ProfileDetails {
  role: UserRole
  dateOfBirth: string
  country: string
}
