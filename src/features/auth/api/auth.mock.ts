import { ApiError } from '@/lib/api/client'
import { local } from '@/lib/storage'
import type { Session, User } from '../types'
import type { AuthApi } from './auth.service'

/**
 * In-browser stand-in for the backend so the flows can be exercised end to end.
 * Any 4-digit code is accepted. Remove once the real API is wired up.
 */
const USERS_KEY = 'communiti-mock-users'
const CURRENT_KEY = 'communiti-mock-current'

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms))
const users = () => local.get<Record<string, User>>(USERS_KEY) ?? {}
const saveUser = (user: User) => local.set(USERS_KEY, { ...users(), [user.email]: user })

function currentUser() {
  const email = local.get<string>(CURRENT_KEY)
  const user = email ? users()[email] : undefined
  if (!user) throw new ApiError('Your session has expired. Please log in again.', 401)
  return user
}

function createSession(email: string): Session {
  const user = users()[email] ?? {
    id: crypto.randomUUID(),
    email,
    interests: [],
    onboardingComplete: false,
  }
  saveUser(user)
  local.set(CURRENT_KEY, email)
  return { token: `mock-${user.id}`, user }
}

export const mockAuthApi: AuthApi = {
  async requestSignUpCode(email) {
    await delay()
    if (users()[email]?.onboardingComplete) {
      throw new ApiError('An account with this email already exists. Please log in.', 409)
    }
  },

  async requestLoginCode(email) {
    await delay()
    if (!users()[email]) throw new ApiError('We couldn’t find an account with that email.', 404)
  },

  async verifyCode({ email, code }) {
    await delay()
    if (!/^\d{4}$/.test(code)) throw new ApiError('That code is invalid. Please try again.', 422)
    return createSession(email)
  },

  async updateProfile(details) {
    await delay()
    const user = { ...currentUser(), ...details }
    saveUser(user)
    return user
  },

  async updateInterests(topics) {
    await delay()
    const user = { ...currentUser(), interests: topics, onboardingComplete: true }
    saveUser(user)
    return user
  },

  async continueWithGoogle() {
    await delay()
    return createSession('google.user@example.com')
  },
}
