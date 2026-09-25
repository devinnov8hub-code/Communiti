import { EnvelopeSimple } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BrandWelcome } from '@/components/brand/Logo'
import { Button, Divider, TextField } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi } from '../api/auth.service'
import { AuthHeading } from '../components/AuthHeading'
import { AuthLayout } from '../components/AuthLayout'
import { AuthSwitchPrompt } from '../components/AuthSwitchPrompt'
import { FormAlert } from '../components/FormAlert'
import { GoogleButton } from '../components/GoogleButton'
import { useAuth } from '../hooks/useAuth'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import { loginSchema, type LoginValues } from '../schemas'

export function LoginPage() {
  const navigate = useNavigate()
  const { startVerification, lastUserName } = useAuth()
  const google = useGoogleSignIn()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '' } })

  const submit = useAsyncAction(async ({ email }: LoginValues) => {
    await authApi.requestLoginCode(email)
    startVerification({ email, flow: 'login' })
    navigate(paths.verify)
  })

  return (
    <AuthLayout hero="mentor">
      <div className="flex flex-col gap-gap-lg">
        <BrandWelcome />

        <div className="flex flex-col gap-10 sm:gap-gap-2xl">
          <AuthHeading
            title={<>Welcome back{lastUserName && <span className="text-brand-orange"> {lastUserName}</span>}</>}
            description="Login to your account to continue."
          />

          <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-gap-xl">
            <TextField
              label="Enter email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              icon={<EnvelopeSimple className="size-6" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <FormAlert message={submit.error ?? google.error} />

            <Button type="submit" loading={submit.pending}>
              Login
            </Button>
          </form>

          <div className="flex flex-col items-center gap-gap-sm">
            <Divider label="Or Continue with" />
            <GoogleButton onClick={() => google.run()} loading={google.pending} />
            <AuthSwitchPrompt prompt="Don’t have an account?" linkLabel="Sign Up" to={paths.signUp} />
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
