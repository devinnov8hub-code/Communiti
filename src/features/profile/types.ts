import type { UserRole } from '@/features/auth/types'

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance'
export type JobType = 'on-site' | 'remote' | 'hybrid'

export interface Experience {
  id: string
  title: string
  company: string
  location?: string
  employmentType: EmploymentType
  jobType: JobType
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD, or undefined when current */
  endDate?: string
}

export interface Profile {
  id: string
  name: string
  role: UserRole
  profession: string
  bio: string
  location: string
  website?: string
  avatarUrl?: string
  coverUrl?: string
  collaborations: number
  following: number
  followers: number
  postsCount: number
  projectsCount: number
  openToCollaborations: boolean
  skills: string[]
  experiences: Experience[]
}

export interface ProfileUpdate {
  name: string
  role: UserRole
  profession: string
  avatar?: File
}

export type NewExperience = Omit<Experience, 'id'>

export const SKILL_CATEGORIES = ['All', 'Tech', 'Design', 'Business', 'Writing', 'Marketing'] as const
export type SkillCategory = (typeof SKILL_CATEGORIES)[number]

export interface SkillOption {
  name: string
  category: Exclude<SkillCategory, 'All'>
}
