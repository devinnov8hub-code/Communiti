import type { Session } from '@/features/auth/types'
import { apiRequest, USE_MOCK_API } from '@/lib/api/legacy'
import { local } from '@/lib/storage'
import type { AccountSettings, DeleteReason, LanguageCode, VisibilitySettings } from '../types'

/** Settings API contract (current user). See README for the endpoint list. */
export interface SettingsApi {
  getAccount(): Promise<AccountSettings>
  updateAccount(input: Omit<AccountSettings, 'email'>): Promise<AccountSettings>
  getVisibility(): Promise<VisibilitySettings>
  updateVisibility(input: VisibilitySettings): Promise<VisibilitySettings>
  getLanguage(): Promise<LanguageCode>
  updateLanguage(language: LanguageCode): Promise<LanguageCode>
  sendSupportReport(message: string): Promise<void>
  deleteAccount(reasons: DeleteReason[]): Promise<void>
}

const httpSettingsApi: SettingsApi = {
  getAccount: () => apiRequest('/users/me/account'),
  updateAccount: (input) => apiRequest('/users/me/account', { method: 'PATCH', body: input }),
  getVisibility: () => apiRequest('/users/me/visibility'),
  updateVisibility: (input) => apiRequest('/users/me/visibility', { method: 'PUT', body: input }),
  getLanguage: async () => (await apiRequest<{ language: LanguageCode }>('/users/me/language')).language,
  updateLanguage: async (language) =>
    (await apiRequest<{ language: LanguageCode }>('/users/me/language', { method: 'PUT', body: { language } }))
      .language,
  sendSupportReport: (message) => apiRequest('/support/reports', { method: 'POST', body: { message } }),
  deleteAccount: (reasons) => apiRequest('/users/me', { method: 'DELETE', body: { reasons } }),
}

/* ---------------------------------- Mock ---------------------------------- */

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))
const KEY = 'communiti-mock-settings'

interface Stored {
  account?: Partial<AccountSettings>
  visibility: VisibilitySettings
  language: LanguageCode
}

const load = (): Stored =>
  local.get<Stored>(KEY) ?? { visibility: { messages: 'no-one', collaborationRequests: 'no-one' }, language: 'en' }
const save = (patch: Partial<Stored>) => local.set(KEY, { ...load(), ...patch })

function account(): AccountSettings {
  const user = local.get<Session>('communiti-session')?.user
  return {
    email: user?.email ?? 'user@email.com',
    dateOfBirth: user?.dateOfBirth ?? '',
    country: user?.country ?? 'NG',
    city: 'Federal Capital Territory',
    education: 'Bsc.',
    role: user?.role ?? 'expert',
    profession: 'Fishery Engineer',
    ...load().account,
  }
}

const mockSettingsApi: SettingsApi = {
  async getAccount() {
    await delay()
    return account()
  },
  async updateAccount(input) {
    await delay()
    save({ account: input })
    return account()
  },
  async getVisibility() {
    await delay()
    return load().visibility
  },
  async updateVisibility(visibility) {
    await delay()
    save({ visibility })
    return visibility
  },
  async getLanguage() {
    await delay(150)
    return load().language
  },
  async updateLanguage(language) {
    await delay()
    save({ language })
    return language
  },
  async sendSupportReport() {
    await delay(500)
  },
  async deleteAccount() {
    await delay(600)
    local.set(KEY, null)
  },
}

export const settingsApi: SettingsApi = USE_MOCK_API ? mockSettingsApi : httpSettingsApi
