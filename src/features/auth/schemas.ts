import { z } from 'zod'
import { INTEREST_TOPICS, OTP_LENGTH } from './constants'

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

const MIN_AGE = 13

export const profileSchema = z.object({
  memberRole: z.enum(
    ['researcher', 'innovator', 'professional', 'learner', 'expert', 'investor', 'student'],
    { message: 'Select your role' },
  ),
  dateOfBirth: z
    .string()
    .min(1, 'Select your date of birth')
    .refine((value) => {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return false
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE)
      return date <= cutoff
    }, `You must be at least ${MIN_AGE} years old`),
  country: z.string().min(1, 'Select your country'),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const interestsSchema = z.object({
  topics: z.array(z.enum(INTEREST_TOPICS)).min(1, 'Select at least one topic'),
})
export type InterestsValues = z.infer<typeof interestsSchema>
