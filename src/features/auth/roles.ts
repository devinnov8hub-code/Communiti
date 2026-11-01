import type { SubmitRoleBody } from '@/lib/api'
import innovatorImage from '@/assets/auth/roles/innovator.png'
import learnerImage from '@/assets/auth/roles/learner.png'
import professionalImage from '@/assets/auth/roles/professional.png'
import researcherImage from '@/assets/auth/roles/researcher.png'

export type SelectableRole = SubmitRoleBody['memberRole']

/** The roles a member can pick (Figma "Select user type"), each with its own form. */
export const SELECTABLE_ROLES: readonly {
  value: SelectableRole
  label: string
  image: string
  description: string
  /** Line under the form's title. */
  formDescription: string
}[] = [
  {
    value: 'researcher',
    label: 'Researcher',
    image: researcherImage,
    description:
      'You study problems, test ideas and publish what you find. Share your work, find partners for your research, and connect it with the people who can put it into practice.',
    formDescription: 'Verify your identity and tell us about your research to complete your profile.',
  },
  {
    value: 'innovator',
    label: 'Innovator',
    image: innovatorImage,
    description:
      'You are building a product, venture or solution. Showcase your project, find collaborators and experts, and get the feedback and support to take your idea further.',
    formDescription: 'Show evidence of your venture or project to complete your profile.',
  },
  {
    value: 'professional',
    label: 'Professional',
    image: professionalImage,
    description:
      'You bring industry experience. Mentor founders, evaluate projects, and lend your expertise, network or funding to ideas that are ready to grow.',
    formDescription: 'For professionals who support, guide, fund, and shape innovative ideas.',
  },
  {
    value: 'learner',
    label: 'Learner',
    image: learnerImage,
    description:
      'You are a student or early in your career. Build your skills, follow real projects, and connect with mentors and opportunities as you find your place in the ecosystem.',
    formDescription: 'Learn, grow, and connect with opportunities across the innovation ecosystem.',
  },
]
