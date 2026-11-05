import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import logoMark from '@/assets/brand/logo-mark.svg'
import { adminPaths } from '../paths'
import { Button, PasswordField, TextField, useToast } from '@/components/ui'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { FormAlert } from '@/features/auth/components/FormAlert'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi } from '@/lib/api'
import { useAdminSession } from '../session/adminSessionContext'
import { toAdminSession } from '../session/toAdminSession'

const email = z.string().trim().min(1, 'Enter your email').email('Enter a valid email address')
const password = z.string().min(8, 'Use at least 8 characters')

const submitClass = 'h-[37px] bg-brand-orange text-body-s'

function Heading({ accent, rest, description }: { accent: string; rest: string; description: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-h4 font-semibold text-fg">
        <span className="text-brand-orange">{accent}</span> {rest}
      </h1>
      <p className="text-body-s text-fg-muted">{description}</p>
    </div>
  )
}

function BackLink({ to }: { to: string }) {
  return (
    <Link to={to} className="flex w-fit items-center gap-1 text-body-s text-fg-muted hover:text-fg">
      <ArrowLeft aria-hidden className="size-4" />
      Back
    </Link>
  )
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <AuthLayout hero="team">
      <div className="flex flex-col gap-gap-md">{children}</div>
    </AuthLayout>
  )
}

/* --------------------------------- Login -------------------------------- */

const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') })

/** Admin sign-in ( "Login"). */
export function AdminLoginPage() {
  const { signIn } = useAdminSession()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  // react-hook-form collects and validates the fields; `values` is what the user typed.
  const submit = useAsyncAction(async (values: z.infer<typeof loginSchema>) => {
    const response = await authApi.adminLogin(values)
    signIn(toAdminSession(response))
    navigate(adminPaths.overview, { replace: true })
  })

  return (
    <Screen>
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2">
          <img src={logoMark} alt="" width={35} height={42} className="h-10.5 w-auto" />
          <span className="text-[28px] font-semibold text-brand-orange sm:text-[32px]">CommUniti</span>
          <span className="self-end pb-1.5 text-body-l font-semibold text-fg-muted sm:text-h4">Admin</span>
        </p>
        <p className="text-body-s text-fg-muted">Manage Users, Forums, and Projects in one place</p>
      </div>
      <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-3">
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="Enter your email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Enter password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Link
          to={adminPaths.resetPassword}
          className="self-end text-caption font-semibold text-brand-orange hover:underline"
        >
          Forgot Password
        </Link>
        <FormAlert message={submit.error} />
        <Button type="submit" loading={submit.pending} className={`${submitClass} mt-2`}>
          Login
        </Button>
      </form>
    </Screen>
  )
}

/* ----------------------------- Reset password ---------------------------- */

const resetSchema = z.object({ email })

/** Request a reset code ( "Reset password"). */
export function AdminResetPasswordPage() {
  const { setReset, reset } = useAdminSession()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetSchema), defaultValues: { email: reset?.email ?? '' } })

  const submit = useAsyncAction(async (values: z.infer<typeof resetSchema>) => {
    await authApi.forgotPassword({ email: values.email })
    setReset({ email: values.email })
    navigate(adminPaths.verifyOtp)
  })

  return (
    <Screen>
      <div className="flex flex-col gap-2">
        <BackLink to={adminPaths.login} />
        <Heading accent="Reset" rest="Password" description="Enter the admin email associated with this account." />
      </div>
      <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-gap-sm">
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="Enter your email"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormAlert message={submit.error} />
        <Button type="submit" loading={submit.pending} className={submitClass}>
          Send OTP
        </Button>
      </form>
    </Screen>
  )
}

/* ------------------------------- Confirm OTP ------------------------------ */

const otpSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') })

/** Enter the emailed code ("Confirm OTP"). */
export function AdminVerifyOtpPage() {
  const { reset, setReset } = useAdminSession()
  const navigate = useNavigate()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(otpSchema), defaultValues: { code: '' } })

  const submit = useAsyncAction(async ({ code }: z.infer<typeof otpSchema>) => {
    const { resetToken } = await authApi.verifyPasswordResetCode({ email: reset!.email, code })
    setReset({ email: reset!.email, resetToken })
    navigate(adminPaths.newPassword)
  })
  const resend = useAsyncAction(async () => {
    await authApi.forgotPassword({ email: reset!.email })
    toast(`A new code was sent to ${reset!.email}`)
  })

  if (!reset) return <Navigate to={adminPaths.resetPassword} replace />

  return (
    <Screen>
      <div className="flex flex-col gap-2">
        <BackLink to={adminPaths.resetPassword} />
        <Heading accent="Enter" rest="OTP" description={`Enter the code we sent to ${reset.email}.`} />
      </div>
      <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-3">
        <TextField
          label="Enter OTP"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="_ _ _ _ _ _"
          className="[&_input]:tracking-[0.4em]"
          error={errors.code?.message}
          {...register('code')}
        />
        <button
          type="button"
          onClick={() => resend.run()}
          disabled={resend.pending}
          className="self-end text-caption font-semibold text-brand-orange hover:underline disabled:opacity-60"
        >
          Resend OTP
        </button>
        <FormAlert message={submit.error ?? resend.error} />
        <Button type="submit" loading={submit.pending} className={`${submitClass} mt-2`}>
          Confirm OTP
        </Button>
      </form>
    </Screen>
  )
}

/* ------------------------------ New password ------------------------------ */

const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((values) => values.password === values.confirm, { path: ['confirm'], message: 'Passwords don’t match' })

/** Choose a new password. */
export function AdminNewPasswordPage() {
  const { reset, setReset } = useAdminSession()
  const [finished, setFinished] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: '', confirm: '' } })

  const submit = useAsyncAction(async (values: z.infer<typeof newPasswordSchema>) => {
    await authApi.resetPassword({ resetToken: reset!.resetToken!, newPassword: values.password })
    toast('Password changed — sign in with your new password')
    // Mark done first so this screen's guard doesn't redirect while we navigate away.
    setFinished(true)
    setReset(null)
    navigate(adminPaths.login, { replace: true })
  })

  if (!reset?.resetToken && !finished) return <Navigate to={adminPaths.resetPassword} replace />

  return (
    <Screen>
      <Heading accent="Change" rest="Password" description="Choose a new password for this admin account." />
      <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-3">
        <PasswordField
          label="New Password"
          autoComplete="new-password"
          placeholder="Enter new password"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Enter password again"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <FormAlert message={submit.error} />
        <Button type="submit" loading={submit.pending} className={`${submitClass} mt-3`}>
          Finish
        </Button>
      </form>
    </Screen>
  )
}
