import { ArrowLeft } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { LogoLockup } from '@/components/brand/Logo'
import { Button, FieldError } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi } from '../api/auth.service'
import { AuthHeading } from '../components/AuthHeading'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { OtpInput } from '../components/OtpInput'
import { ResendCode } from '../components/ResendCode'
import { VerifyIllustration } from '../components/VerifyIllustration'
import { OTP_LENGTH } from '../constants'
import { useAuth } from '../hooks/useAuth'
import { verificationSchema, type VerificationValues } from '../schemas'

export function VerifyCodePage() {
  const navigate = useNavigate()
  const { pending, signIn } = useAuth()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VerificationValues>({ resolver: zodResolver(verificationSchema), defaultValues: { code: '' } })

  const submit = useAsyncAction(async ({ code }: VerificationValues) => {
    if (!pending) return
    const session = await authApi.verifyCode({ email: pending.email, code, flow: pending.flow })
    signIn(session)
    const done = pending.flow === 'login' && session.user.onboardingComplete
    navigate(done ? paths.home : paths.onboardingProfile, { replace: true })
  })

  // Nothing to verify (e.g. page refreshed in a new tab) — start over.
  if (!pending) return <Navigate to={paths.signUp} replace />

  const backTo = pending.flow === 'login' ? paths.login : paths.signUp
  const errorId = 'verification-code-error'

  return (
    <AuthLayout hero="mentor">
      <div className="flex flex-col gap-gap-lg">
        <LogoLockup className="h-[35px] w-[150px]" />

        <div className="flex flex-col gap-[23px]">
          <Link
            to={backTo}
            className="flex w-fit items-center gap-1 text-body-m text-grey-40 hover:text-fg dark:text-white"
          >
            <ArrowLeft aria-hidden className="size-6" />
            Back
          </Link>

          <VerifyIllustration />

          <AuthHeading
            title="Enter verification code"
            description={
              <>
                We sent a {OTP_LENGTH}-digit code to <span className="font-semibold text-fg">{pending.email}</span>
              </>
            }
            className="[&>p]:sr-only"
          />

          <form
            noValidate
            onSubmit={handleSubmit(submit.run)}
            className="flex flex-col items-center gap-10 sm:gap-gap-2xl"
          >
            <div className="flex w-full flex-col gap-2">
              <Controller
                control={control}
                name="code"
                render={({ field }) => (
                  <OtpInput
                    length={OTP_LENGTH}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.code)}
                    disabled={submit.pending}
                    aria-describedby={errors.code ? errorId : undefined}
                    autoFocus
                  />
                )}
              />
              {errors.code?.message && <FieldError id={errorId}>{errors.code.message}</FieldError>}
              <FormAlert message={submit.error} />
            </div>

            <div className="flex w-full flex-col gap-gap-md">
              <Button type="submit" loading={submit.pending}>
                Proceed
              </Button>
              <ResendCode pending={pending} onResent={() => reset({ code: '' })} />
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}
