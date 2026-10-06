import profileCover from '@/assets/mock/profile-cover.webp'
import type { Session } from '@/features/auth/types'
import { getDisplayName } from '@/features/auth/user'
import { apiRequest, USE_MOCK_API } from '@/lib/api/legacy'
import { local } from '@/lib/storage'
import type { NewExperience, Profile, ProfileUpdate, SkillOption } from '../types'

/** Profile API contract (current user). See README for the endpoint list. */
export interface ProfileApi {
  getMyProfile(): Promise<Profile>
  updateProfile(input: ProfileUpdate): Promise<Profile>
  setOpenToCollaborations(open: boolean): Promise<Profile>
  setSkills(skills: string[]): Promise<Profile>
  addExperience(input: NewExperience): Promise<Profile>
  removeExperience(id: string): Promise<Profile>
  getSkillOptions(): Promise<SkillOption[]>
}

const httpProfileApi: ProfileApi = {
  getMyProfile: () => apiRequest('/users/me'),
  updateProfile: ({ avatar, ...fields }) => {
    const form = new FormData()
    Object.entries(fields).forEach(([key, value]) => form.append(key, value))
    if (avatar) form.append('avatar', avatar)
    return apiRequest('/users/me', { method: 'PATCH', body: form })
  },
  setOpenToCollaborations: (open) => apiRequest('/users/me', { method: 'PATCH', body: { openToCollaborations: open } }),
  setSkills: (skills) => apiRequest('/users/me/skills', { method: 'PUT', body: { skills } }),
  addExperience: (input) => apiRequest('/users/me/experiences', { method: 'POST', body: input }),
  removeExperience: (id) => apiRequest(`/users/me/experiences/${id}`, { method: 'DELETE' }),
  getSkillOptions: () => apiRequest('/skills'),
}

/* ------------------------- Mock (Figma content) ------------------------- */

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))
const KEY = 'communiti-mock-profile'

const SKILL_OPTIONS: SkillOption[] = [
  { name: 'Artificial Intelligence', category: 'Tech' },
  { name: 'Video Editing', category: 'Design' },
  { name: 'Financial advisory', category: 'Business' },
  { name: 'Personal Tax planning', category: 'Business' },
  { name: 'Videography', category: 'Design' },
  { name: 'Event photography', category: 'Design' },
  { name: 'Web design', category: 'Design' },
  { name: 'Mobile App development', category: 'Tech' },
  { name: 'Web development', category: 'Tech' },
  { name: 'Technical writing', category: 'Writing' },
  { name: 'Copywriting', category: 'Writing' },
  { name: 'Digital marketing', category: 'Marketing' },
  { name: 'Brand strategy', category: 'Marketing' },
]

function seed(): Profile {
  const user = local.get<Session>('communiti-session')?.user
  return {
    id: user?.id ?? 'me',
    name: user ? getDisplayName(user) : 'Van Gerald',
    role: user?.role ?? 'expert',
    profession: 'Fishery Engineer',
    bio: 'I am passionate about sustainable fisheries, aquaculture, and innovative solutions for food security and community development.',
    location: 'Federal Capital Territory, Nigeria',
    website: 'www.website.com',
    avatarUrl: user?.avatarUrl,
    coverUrl: profileCover,
    collaborations: 23,
    following: 1200,
    followers: 300,
    postsCount: 98,
    projectsCount: 2,
    openToCollaborations: true,
    skills: ['Web design', 'Mobile App development', 'Web development'],
    experiences: [
      {
        id: 'x-1',
        title: 'Systems Engineer',
        company: 'AZ Developments',
        location: 'Nigeria',
        employmentType: 'full-time',
        jobType: 'on-site',
        startDate: '2025-04-01',
      },
    ],
  }
}

const load = () => local.get<Profile>(KEY) ?? seed()
const save = (profile: Profile) => {
  local.set(KEY, profile)
  return profile
}

const mockProfileApi: ProfileApi = {
  async getMyProfile() {
    await delay()
    return load()
  },
  async updateProfile({ avatar, ...fields }) {
    await delay()
    const avatarUrl = avatar
      ? await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.readAsDataURL(avatar)
        })
      : undefined
    return save({ ...load(), ...fields, ...(avatarUrl && { avatarUrl }) })
  },
  async setOpenToCollaborations(open) {
    await delay(150)
    return save({ ...load(), openToCollaborations: open })
  },
  async setSkills(skills) {
    await delay()
    return save({ ...load(), skills })
  },
  async addExperience(input) {
    await delay()
    const profile = load()
    return save({ ...profile, experiences: [{ id: crypto.randomUUID(), ...input }, ...profile.experiences] })
  },
  async removeExperience(id) {
    await delay()
    const profile = load()
    return save({ ...profile, experiences: profile.experiences.filter((item) => item.id !== id) })
  },
  async getSkillOptions() {
    await delay(150)
    return SKILL_OPTIONS
  },
}

export const profileApi: ProfileApi = USE_MOCK_API ? mockProfileApi : httpProfileApi
