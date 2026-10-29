import { ArrowLeft, EnvelopeSimple } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { LogoLockup } from '@/components/brand/Logo'
import { Button, PasswordField, TextField, useToast } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi } from '../api/auth.service'
import { AuthHeading } from '../components/AuthHeading'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { useAuth } from '../hooks/useAuth'
import { newPasswordSchema, resetEmailSchema, type NewPasswordValues, type ResetEmailValues } from '../schemas'

/** "Reset password": emails a code, then the shared code screen (/verify) confirms it. */
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { pending, startVerification } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetEmailValues>({
    resolver: zodResolver(resetEmailSchema),
    defaultValues: { email: pending?.flow === 'reset' ? pending.email : '' },
  })

  const submit = useAsyncAction(async ({ email }: ResetEmailValues) => {
    await authApi.forgotPassword(email)
    startVerification({ email, flow: 'reset' })
    navigate(paths.verify)
  })

  return (
    <AuthLayout hero="mentor">
      <div className="flex flex-col gap-gap-lg">
        <LogoLockup className="h-[35px] w-[150px]" />

        <div className="flex flex-col gap-[23px]">
          <Link
            to={paths.login}
            className="flex w-fit items-center gap-1 text-body-m text-grey-40 hover:text-fg dark:text-white"
          >
            <ArrowLeft aria-hidden className="size-6" />
            Back
          </Link>

          <AuthHeading title="Reset password" />

          <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-gap-2xl">
            <TextField
              label="Enter the email associated with your account"
              type="email"
              autoComplete="email"
              placeholder="Email"
              icon={<EnvelopeSimple className="size-6" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <FormAlert message={submit.error} />
            <Button type="submit" loading={submit.pending}>
              Send reset code
            </Button>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}

/** "Create new password" after the reset code is confirmed. */
export function NewPasswordPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { pending, clearVerification } = useAuth()
  const [finished, setFinished] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const submit = useAsyncAction(async ({ password }: NewPasswordValues) => {
    await authApi.resetPassword({ resetToken: pending!.resetToken!, newPassword: password })
    toast('Password updated — log in with your new password')
    // Mark done first so this screen's guard doesn't redirect while we navigate away.
    setFinished(true)
    clearVerification()
    navigate(paths.login, { replace: true })
  })

  // Reached without a confirmed code (e.g. a refresh in a new tab) — start over.
  if (!finished && !(pending?.flow === 'reset' && pending.resetToken)) {
    return <Navigate to={paths.forgotPassword} replace />
  }

  return (
    <AuthLayout hero="mentor">
      <div className="flex flex-col gap-gap-lg">
        <LogoLockup className="h-[35px] w-[150px]" />

        <div className="flex flex-col gap-[23px]">
          <AuthHeading title="Create new password" />

          <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-gap-xl">
            <div className="flex flex-col gap-gap-md">
              <PasswordField
                label="Enter your new password"
                autoComplete="new-password"
                placeholder="Enter new password"
                error={errors.password?.message}
                {...register('password')}
              />
              <PasswordField
                label="Confirm your new password"
                autoComplete="new-password"
                placeholder="Confirm password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>
            <FormAlert message={submit.error} />
            <Button type="submit" loading={submit.pending}>
              Update password
            </Button>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}
