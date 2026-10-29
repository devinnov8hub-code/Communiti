import { ApiError } from '@/lib/api/errors'
import { local } from '@/lib/storage'
import type { Session, User } from '../types'
import type { AuthApi } from './auth.service'

/**
 * In-browser stand-in for the backend so the flows can be exercised end to end.
 * Any 6-digit code is accepted. Remove once the real API is wired up.
 */
const USERS_KEY = 'communiti-mock-users'
const PASSWORDS_KEY = 'communiti-mock-passwords'
const CURRENT_KEY = 'communiti-mock-current'

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms))
const users = () => local.get<Record<string, User>>(USERS_KEY) ?? {}
const saveUser = (user: User) => local.set(USERS_KEY, { ...users(), [user.email]: user })
const passwords = () => local.get<Record<string, string>>(PASSWORDS_KEY) ?? {}
const savePassword = (email: string, password: string) =>
  local.set(PASSWORDS_KEY, { ...passwords(), [email]: password })
const checkCode = (code: string) => {
  if (!/^\d{6}$/.test(code)) throw new ApiError('That code is invalid. Please try again.', 422)
}

function currentUser() {
  const email = local.get<string>(CURRENT_KEY)
  const user = email ? users()[email] : undefined
  if (!user) throw new ApiError('Your session has expired. Please log in again.', 401)
  return user
}

function createSession(email: string, fullName?: string): Session {
  const [firstName, ...rest] = fullName?.trim().split(/\s+/) ?? []
  const user = users()[email] ?? {
    id: crypto.randomUUID(),
    email,
    firstName,
    lastName: rest.join(' ') || undefined,
    interests: [],
    onboardingComplete: false,
  }
  saveUser(user)
  local.set(CURRENT_KEY, email)
  return { token: `mock-${user.id}`, user }
}

const pendingNames = new Map<string, string>()

export const mockAuthApi: AuthApi = {
  async register({ email, fullName, password }) {
    await delay()
    if (users()[email]) throw new ApiError('An account with this email already exists. Please log in.', 409)
    pendingNames.set(email, fullName)
    savePassword(email, password)
  },

  async verifyEmail({ email, code }) {
    await delay()
    checkCode(code)
    return createSession(email, pendingNames.get(email))
  },

  async resendVerificationEmail() {
    await delay()
  },

  async login({ email, password }) {
    await delay()
    if (!users()[email] || passwords()[email] !== password) {
      throw new ApiError('Incorrect email or password.', 401)
    }
    return createSession(email)
  },

  async forgotPassword() {
    // Always succeeds, so the form can't be used to find out who has an account.
    await delay()
  },

  async verifyResetCode({ email, code }) {
    await delay()
    checkCode(code)
    return { resetToken: `reset-${email}` }
  },

  async resetPassword({ resetToken, newPassword }) {
    await delay()
    savePassword(resetToken.replace(/^reset-/, ''), newPassword)
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
