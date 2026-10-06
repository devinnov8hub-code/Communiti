import { API_BASE_URL, apiRequest, USE_MOCK_API } from '@/lib/api/legacy'
import type { ProfileDetails, Session, User, VerificationFlow } from '../types'
import { mockAuthApi } from './auth.mock'

/**
 * Auth API contract. The HTTP implementation below documents the endpoints the
 * backend is expected to expose; until VITE_API_BASE_URL is set the app runs
 * against `mockAuthApi`, which implements the same interface in the browser.
 */
export interface AuthApi {
  /** Starts sign-up: emails a one-time verification code. */
  requestSignUpCode(email: string): Promise<void>
  /** Starts login: emails a one-time verification code. */
  requestLoginCode(email: string): Promise<void>
  /** Exchanges a verification code for a session. */
  verifyCode(input: { email: string; code: string; flow: VerificationFlow }): Promise<Session>
  /** Onboarding step 1 — role, date of birth, country. */
  updateProfile(details: ProfileDetails): Promise<User>
  /** Onboarding step 2 — feed topics. Completes onboarding. */
  updateInterests(topics: string[]): Promise<User>
  /** Starts Google OAuth. Resolves with a session only in mock mode. */
  continueWithGoogle(): Promise<Session | void>
}

const httpAuthApi: AuthApi = {
  requestSignUpCode: (email) => apiRequest('/auth/signup', { method: 'POST', body: { email } }),
  requestLoginCode: (email) => apiRequest('/auth/login', { method: 'POST', body: { email } }),
  verifyCode: (input) => apiRequest('/auth/verify', { method: 'POST', body: input }),
  updateProfile: (details) => apiRequest('/users/me/profile', { method: 'PATCH', body: details }),
  updateInterests: (topics) => apiRequest('/users/me/interests', { method: 'PUT', body: { topics } }),
  continueWithGoogle: async () => {
    window.location.assign(`${API_BASE_URL}/auth/google`)
  },
}

export const authApi: AuthApi = USE_MOCK_API ? mockAuthApi : httpAuthApi
