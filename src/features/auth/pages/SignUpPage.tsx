import { EnvelopeSimple, NavigationArrow, User } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BrandWelcome } from '@/components/brand/Logo'
import { Button, Checkbox, Divider, PasswordField, TextField } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi, type RegisterBody } from '@/lib/api'
import { AuthLayout } from '../components/AuthLayout'
import { AuthSwitchPrompt } from '../components/AuthSwitchPrompt'
import { FormAlert } from '../components/FormAlert'
import { GoogleButton } from '../components/GoogleButton'
import { useAuth } from '../hooks/useAuth'
import { signUpSchema, type SignUpValues } from '../schemas'

/** "Create account" (name, email, location, password). Emails a code to verify the address. */
export function SignUpPage() {
  const navigate = useNavigate()
  const { startVerification } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      location: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const submit = useAsyncAction(async (data: SignUpValues) => {
    const registerBody: RegisterBody = {
      fullName: data.fullName,
      email: data.email,
      location: data.location,
      password: data.password,
      confirmPassword: data.confirmPassword,
      acceptTerms: true,
    }
    await authApi.register(registerBody)
    startVerification({ email: data.email, flow: 'signup' })
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
                label="Enter fullname"
                autoComplete="name"
                placeholder="e.g John adeboye"
                icon={<User className="size-6" />}
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <TextField
                label="Enter email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                icon={<EnvelopeSimple className="size-6" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label="Input your location"
                autoComplete="address-level2"
                placeholder="Input your location"
                icon={<NavigationArrow className="size-6 -scale-x-100" />}
                error={errors.location?.message}
                {...register('location')}
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
              Create account
            </Button>
          </form>

          <div className="flex flex-col items-center gap-gap-sm">
            <Divider label="Or" />
            <GoogleButton />
            <AuthSwitchPrompt prompt="Already have an account?" linkLabel="Login" to={paths.login} />
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
