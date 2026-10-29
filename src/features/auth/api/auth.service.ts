import { API_BASE_URL, apiRequest, USE_MOCK_API } from '@/lib/api/legacy'
import type { ProfileDetails, Session, SignUpDetails, User } from '../types'
import { mockAuthApi } from './auth.mock'

/**
 * Auth API contract. The HTTP implementation below documents the backend endpoints;
 * until the member app is connected it runs against `mockAuthApi`, which implements
 * the same interface in the browser.
 */
export interface AuthApi {
  /** Creates an unverified account and emails a 6-digit code. */
  register(details: SignUpDetails): Promise<void>
  /** Confirms the sign-up code and signs the member in. */
  verifyEmail(input: { email: string; code: string }): Promise<Session>
  resendVerificationEmail(email: string): Promise<void>
  login(input: { email: string; password: string }): Promise<Session>
  /** Forgot password: emails a 6-digit reset code. */
  forgotPassword(email: string): Promise<void>
  /** Exchanges the reset code for a short-lived reset token. */
  verifyResetCode(input: { email: string; code: string }): Promise<{ resetToken: string }>
  resetPassword(input: { resetToken: string; newPassword: string }): Promise<void>
  /** Onboarding step 1 — role, date of birth, country. */
  updateProfile(details: ProfileDetails): Promise<User>
  /** Onboarding step 2 — feed topics. Completes onboarding. */
  updateInterests(topics: string[]): Promise<User>
  /** Starts Google OAuth. Resolves with a session only in mock mode. */
  continueWithGoogle(): Promise<Session | void>
}

const httpAuthApi: AuthApi = {
  register: ({ password, ...details }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: { ...details, password, confirmPassword: password, acceptTerms: true },
    }),
  verifyEmail: (input) => apiRequest('/auth/verify-email', { method: 'POST', body: input }),
  resendVerificationEmail: (email) => apiRequest('/auth/verify-email/resend', { method: 'POST', body: { email } }),
  login: (input) => apiRequest('/auth/login', { method: 'POST', body: input }),
  forgotPassword: (email) => apiRequest('/auth/password/forgot', { method: 'POST', body: { email } }),
  verifyResetCode: (input) => apiRequest('/auth/password/verify-code', { method: 'POST', body: input }),
  resetPassword: (input) => apiRequest('/auth/password/reset', { method: 'POST', body: input }),
  updateProfile: (details) => apiRequest('/users/me/profile', { method: 'PATCH', body: details }),
  updateInterests: (topics) => apiRequest('/users/me/interests', { method: 'PUT', body: { topics } }),
  continueWithGoogle: async () => {
    window.location.assign(`${API_BASE_URL}/auth/google`)
  },
}

export const authApi: AuthApi = USE_MOCK_API ? mockAuthApi : httpAuthApi
