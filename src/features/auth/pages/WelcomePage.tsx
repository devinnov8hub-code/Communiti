import { EnvelopeSimple } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BrandWelcome } from '@/components/brand/Logo'
import { Button, Checkbox, Divider, PasswordField, Spinner, TextField } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { ApiError, authApi, type InviteLookup } from '@/lib/api'
import { AuthHeading } from '../components/AuthHeading'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { GoogleButton } from '../components/GoogleButton'
import { useAuth } from '../hooks/useAuth'
import { welcomeSchema, type WelcomeValues } from '../schemas'
import { toSession } from '../user'

type View = { kind: 'loading' } | { kind: 'invalid' } | { kind: 'ready'; invite: InviteLookup }

/**
 * Welcome page for people an admin invited (pilot onboarding). The invitation email links here
 * with ?token=…. The person chooses a password (or continues with Google) and then goes through
 * the normal onboarding: role, then interests.
 */
export function WelcomePage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [view, setView] = useState<View>(token ? { kind: 'loading' } : { kind: 'invalid' })

  useEffect(() => {
    if (!token) return
    let stale = false
    authApi
      .checkInvite({ token })
      .then((invite) => !stale && setView({ kind: 'ready', invite }))
      .catch(() => !stale && setView({ kind: 'invalid' }))
    return () => {
      stale = true
    }
  }, [token])

  const markAs = (status: InviteLookup['status']) =>
    setView((current) =>
      current.kind === 'ready' ? { kind: 'ready', invite: { ...current.invite, status } } : current,
    )

  return (
    <AuthLayout hero="team">
      <div className="flex flex-col gap-gap-lg">
        <BrandWelcome />
        {view.kind === 'loading' && (
          <div className="flex justify-center py-16 text-fg">
            <Spinner className="size-8" />
          </div>
        )}
        {view.kind === 'invalid' && <InvalidLink />}
        {view.kind === 'ready' && view.invite.status === 'valid' && (
          <ChoosePassword token={token} invite={view.invite} onStatus={markAs} />
        )}
        {view.kind === 'ready' && view.invite.status === 'expired' && (
          <ExpiredLink token={token} invite={view.invite} />
        )}
        {view.kind === 'ready' && view.invite.status === 'accepted' && <AlreadySetUp />}
      </div>
    </AuthLayout>
  )
}

function ChoosePassword({
  token,
  invite,
  onStatus,
}: {
  token: string
  invite: InviteLookup
  onStatus: (status: InviteLookup['status']) => void
}) {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WelcomeValues>({
    resolver: zodResolver(welcomeSchema),
    defaultValues: { password: '', confirmPassword: '', acceptTerms: false },
  })

  const submit = useAsyncAction(async ({ password }: WelcomeValues) => {
    try {
      const session = toSession(await authApi.acceptInvite({ token, password, acceptTerms: true }))
      signIn(session)
      navigate(session.user.onboardingComplete ? paths.home : paths.onboardingRole, { replace: true })
    } catch (error) {
      // The link expired (or was used) while the page was open: show that screen instead.
      if (error instanceof ApiError && error.code === 'INVITE_EXPIRED') return onStatus('expired')
      if (error instanceof ApiError && error.code === 'INVITE_ACCEPTED') return onStatus('accepted')
      throw error
    }
  })

  return (
    <div className="flex flex-col gap-[23px]">
      <AuthHeading
        title={
          <>
            Welcome, <span className="text-brand-orange">{invite.firstName}</span>
          </>
        }
        description="You’ve been invited to join CommUniti. Choose a password to get started, then set up your profile."
      />

      <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-gap-xl">
        <div className="flex flex-col gap-gap-md">
          <TextField
            label="Your email"
            type="email"
            value={invite.email}
            readOnly
            aria-readonly
            icon={<EnvelopeSimple className="size-6" />}
          />
          <PasswordField
            label="Create password"
            autoComplete="new-password"
            placeholder="******"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            placeholder="******"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Checkbox
            error={errors.acceptTerms?.message}
            label={
              <span className="text-grey-40 underline dark:text-white">
                By Continuing you agree to our{' '}
                <Link to={paths.terms} className="text-brand-green">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to={paths.terms} className="text-brand-green">
                  Conditions
                </Link>
              </span>
            }
            {...register('acceptTerms')}
          />
        </div>

        <FormAlert message={submit.error} />

        <Button type="submit" loading={submit.pending}>
          Continue
        </Button>
      </form>

      <div className="flex flex-col items-center gap-gap-sm">
        <Divider label="Or" />
        <GoogleButton />
        <p className="text-center text-body-s text-fg-muted">Use the Google account for {invite.email}.</p>
      </div>
    </div>
  )
}

const COOLDOWN_SECONDS = 60

/** "Send me a new link": emails a fresh link straight away to the address the invitation went to. */
function ExpiredLink({ token, invite }: { token: string; invite: InviteLookup }) {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [deadline, setDeadline] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!deadline) return
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  const resend = useAsyncAction(async () => {
    const sent = await authApi.resendInvite({ token })
    setSentTo(sent.email)
    setDeadline(Date.now() + (sent.resendAvailableIn || COOLDOWN_SECONDS) * 1000)
  })

  const waiting = secondsLeft > 0

  return (
    <div className="flex flex-col gap-[23px]">
      <AuthHeading
        title="This link has expired"
        description={
          sentTo ? (
            <>
              A new link is on its way to <span className="font-semibold text-fg">{sentTo}</span>. Open it from your
              inbox (check your spam folder too).
            </>
          ) : (
            <>
              Hi {invite.firstName}, invitation links work for 7 days. We can email a new one to{' '}
              <span className="font-semibold text-fg">{invite.email}</span>.
            </>
          )
        }
      />

      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => resend.run()}
          disabled={waiting || resend.pending}
          className="text-body-l font-semibold text-brand-green hover:underline disabled:cursor-not-allowed disabled:text-fg-muted disabled:no-underline"
        >
          {resend.pending
            ? 'Sending…'
            : waiting
              ? `Send another link in ${secondsLeft}s`
              : sentTo
                ? 'Send another link'
                : 'Send me a new link'}
        </button>
        <p aria-live="polite" className="text-body-s text-red-500">
          {resend.error}
        </p>
      </div>

      <p className="text-body-m text-fg-muted">
        Already set a password?{' '}
        <Link to={paths.login} className="font-semibold text-brand-green hover:underline">
          Login
        </Link>
      </p>
    </div>
  )
}

function AlreadySetUp() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-[23px]">
      <AuthHeading title="You’re already set up" description="Your account is ready. Log in to continue." />
      <Button onClick={() => navigate(paths.login)}>Go to login</Button>
      <Link
        to={paths.forgotPassword}
        className="self-center text-body-s font-semibold text-brand-green hover:underline"
      >
        Forgot password?
      </Link>
    </div>
  )
}

function InvalidLink() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-[23px]">
      <AuthHeading
        title="This link isn’t valid"
        description="Open the link from your invitation email again, making sure you use the whole link. If you’ve already set up your account, log in instead."
      />
      <Button onClick={() => navigate(paths.login)}>Go to login</Button>
    </div>
  )
}
