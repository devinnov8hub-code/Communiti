import { z } from 'zod'
import { INTEREST_TOPICS, OTP_LENGTH } from './constants'

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address')

export const signUpSchema = z.object({
  email,
  acceptTerms: z.boolean().refine(Boolean, 'Please accept the Terms and Conditions to continue'),
})
export type SignUpValues = z.infer<typeof signUpSchema>

export const loginSchema = z.object({ email })
export type LoginValues = z.infer<typeof loginSchema>

export const verificationSchema = z.object({
  code: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
})
export type VerificationValues = z.infer<typeof verificationSchema>

const MIN_AGE = 13

export const profileSchema = z.object({
  role: z.enum(['artisan', 'expert', 'researcher'], { error: 'Select your role' }),
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
