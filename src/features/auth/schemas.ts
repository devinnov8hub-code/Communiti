import { z } from 'zod'
import { OTP_LENGTH } from './constants'

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address')

/** Same rule as the backend: 8–128 characters with a letter and a number. */
const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'Use 128 characters or fewer')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number')

const passwordsMatch = { path: ['confirmPassword'], message: 'Passwords don’t match' }

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(80),
    email,
    location: z.string().trim().min(2, 'Enter your location').max(120),
    password: newPassword,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptTerms: z.boolean().refine(Boolean, 'Please accept the Terms and Conditions to continue'),
  })
  .refine((values) => values.password === values.confirmPassword, passwordsMatch)
export type SignUpValues = z.infer<typeof signUpSchema>

export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') })
export type LoginValues = z.infer<typeof loginSchema>

export const resetEmailSchema = z.object({ email })
export type ResetEmailValues = z.infer<typeof resetEmailSchema>

export const newPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string().min(1, 'Confirm your new password') })
  .refine((values) => values.password === values.confirmPassword, passwordsMatch)
export type NewPasswordValues = z.infer<typeof newPasswordSchema>

export const verificationSchema = z.object({
  code: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
})
export type VerificationValues = z.infer<typeof verificationSchema>

/* Role forms: limits follow the backend. Optional boxes left empty aren't sent. */
const blankToUndefined = (value: string) => value || undefined

const optionalText = (max: number) => z.string().trim().max(max).transform(blankToUndefined)

export const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .refine((value) => !value || z.email().safeParse(value).success, 'Enter a valid email address')
  .transform(blankToUndefined)

const optionalLink = z
  .string()
  .trim()
  .max(500)
  // People usually paste "linkedin.com/in/…"; the backend needs a full URL.
  .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
  .refine((value) => !value || z.url().safeParse(value).success, 'Enter a valid link')
  .transform(blankToUndefined)

export const researcherSchema = z
  .object({
    institutionalEmail: optionalEmail,
    orcidId: z
      .string()
      .trim()
      .refine((value) => !value || /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(value), 'Use the format 0000-0000-0000-0000')
      .transform(blankToUndefined),
    researchProjectLink: optionalLink,
    researchEvidence: optionalText(2000),
  })
  .refine((values) => values.institutionalEmail || values.orcidId, {
    path: ['institutionalEmail'],
    message: 'Enter your institutional email or ORCID iD',
  })

export const MAX_EVIDENCE_FILES = 5
export const MAX_OTHER_CUE_FILES = 10

export const innovatorSchema = z.object({
  ventureName: z.string().trim().min(2, 'Enter your project or venture name').max(120),
  description: optionalText(2000),
  developmentStage: z.enum(['open', 'ongoing', 'closed'], { message: 'Select a development stage' }),
  evidenceLink: optionalLink,
  evidenceFiles: z.array(z.instanceof(File)).max(MAX_EVIDENCE_FILES),
  otherCueFiles: z.array(z.instanceof(File)).max(MAX_OTHER_CUE_FILES),
})

export const professionalSchema = z.object({
  organizationName: z.string().trim().min(2, 'Enter your organization name').max(160),
  profileLink: optionalLink,
  professionalTitle: z.string().trim().min(2, 'Enter your professional title').max(100),
  workEmail: optionalEmail,
})

export const learnerSchema = z.object({
  studentEmail: optionalEmail,
  institution: z.string().trim().min(2, 'Enter your school or institution').max(160),
  courseOfStudy: z.string().trim().min(2, 'Enter your course or area of study').max(160),
  level: optionalText(40),
})

export const interestsSchema = z.object({
  topics: z.array(z.string()).min(1, 'Select at least one topic').max(20, 'Select up to 20 topics'),
})
export type InterestsValues = z.infer<typeof interestsSchema>
