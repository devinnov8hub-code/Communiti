import type { SelectOption } from '@/components/ui'
import type { UserRole } from './types'

export const OTP_LENGTH = 6

export const USER_ROLES = [
  'researcher',
  'innovator',
  'professional',
  'learner',
  'expert',
  'investor',
  'student',
] as const satisfies readonly UserRole[]

export const ROLE_OPTIONS: readonly (SelectOption & { value: UserRole })[] = [
  { value: 'researcher', label: 'Researcher' },
  { value: 'innovator', label: 'Innovator' },
  { value: 'professional', label: 'Professional' },
  { value: 'expert', label: 'Expert' },
  { value: 'learner', label: 'Learner' },
  { value: 'investor', label: 'Investor' },
  { value: 'student', label: 'Student' },
]

export const INTEREST_TOPICS = [
  'Artificial Intelligence & Machine Learning',
  'Entrepreneurship & Startups',
  'Social Impact & Community Development',
  'Manufacturing & Industry 4.0',
  'Cybersecurity & Digital Trust',
  'Robotics & Automation',
  'Smart Cities & Infrastructure',
  'FinTech & Digital Finance',
  'Internet of Things (IoT)',
] as const
