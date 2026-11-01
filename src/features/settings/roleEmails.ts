import type { Me, SubmitRoleBody, VerificationDetails } from '@/lib/api'

type DetailKey = keyof VerificationDetails

interface RoleEmailConfig {
  field: DetailKey
  label: string
  placeholder: string
  /** The role's other details: PUT /me/role replaces them all, so they are sent again unchanged. */
  keep: DetailKey[]
}

const ROLE_EMAILS: Partial<Record<NonNullable<Me['memberRole']>, RoleEmailConfig>> = {
  researcher: {
    field: 'institutionalEmail',
    label: 'Institutional email',
    placeholder: 'school321@email.com',
    keep: ['orcidId', 'researchProjectLink', 'researchEvidence'],
  },
  professional: {
    field: 'workEmail',
    label: 'Work or institutional email',
    placeholder: 'your@companyemail.com',
    keep: ['organizationName', 'profileLink', 'professionalTitle'],
  },
  learner: {
    field: 'studentEmail',
    label: 'Student email',
    placeholder: 'gabriel@schoolemail.com',
    keep: ['institution', 'courseOfStudy', 'level'],
  },
}

export interface RoleEmail extends RoleEmailConfig {
  value: string
  memberRole: NonNullable<Me['memberRole']>
  details: VerificationDetails
}

/** The email on the member's role form, for the roles that have one and have submitted that form. */
export function getRoleEmail(me: Me): RoleEmail | null {
  const config = me.memberRole && ROLE_EMAILS[me.memberRole]
  const details = me.verification?.details
  if (!me.memberRole || !config || !details) return null
  return { ...config, value: (details[config.field] as string | undefined) ?? '', memberRole: me.memberRole, details }
}

export function changeEmailBody({ memberRole, details, field, keep }: RoleEmail, email: string) {
  const kept = keep.flatMap((key) => (details[key] == null ? [] : [[key, details[key]]]))
  return { memberRole, details: { ...Object.fromEntries(kept), [field]: email } } as unknown as SubmitRoleBody
}
