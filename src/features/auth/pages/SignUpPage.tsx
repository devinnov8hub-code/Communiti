import { EnvelopeSimple } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BrandWelcome } from '@/components/brand/Logo'
import { Button, Checkbox, Divider, TextField } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi } from '../api/auth.service'
import { AuthLayout } from '../components/AuthLayout'
import { AuthSwitchPrompt } from '../components/AuthSwitchPrompt'
import { FormAlert } from '../components/FormAlert'
import { GoogleButton } from '../components/GoogleButton'
import { useAuth } from '../hooks/useAuth'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import { signUpSchema, type SignUpValues } from '../schemas'

export function SignUpPage() {
  const navigate = useNavigate()
  const { startVerification } = useAuth()
  const google = useGoogleSignIn()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', acceptTerms: false },
  })

  const submit = useAsyncAction(async ({ email }: SignUpValues) => {
    await authApi.requestSignUpCode(email)
    startVerification({ email, flow: 'signup' })
    navigate(paths.verify)
  })

  return (
    <AuthLayout hero="team">
      <div className="flex flex-col gap-gap-lg">
        <BrandWelcome />

        <div className="flex flex-col gap-[23px]">
          <h1 className="text-title-sm font-bold text-fg sm:text-head2">Create an account</h1>

          <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-gap-xl">
            <div className="flex flex-col gap-gap-md">
              <TextField
                label="Enter email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                icon={<EnvelopeSimple className="size-6" />}
                error={errors.email?.message}
                {...register('email')}
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

            <FormAlert message={submit.error ?? google.error} />

            <Button type="submit" loading={submit.pending}>
              Create account
            </Button>
          </form>

          <div className="flex flex-col items-center gap-gap-sm">
            <Divider label="Or" />
            <GoogleButton onClick={() => google.run()} loading={google.pending} />
            <AuthSwitchPrompt prompt="Already have an account?" linkLabel="LogIn" to={paths.login} />
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
