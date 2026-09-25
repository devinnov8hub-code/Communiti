import { AddressBook, CalendarDots, GlobeHemisphereWest } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { LogoLockup } from '@/components/brand/Logo'
import { Button, DateField, SelectField } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi } from '../api/auth.service'
import { AuthHeading } from '../components/AuthHeading'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { COUNTRY_OPTIONS, ROLE_OPTIONS } from '../constants'
import { useAuth } from '../hooks/useAuth'
import { profileSchema, type ProfileValues } from '../schemas'

const today = new Date().toISOString().slice(0, 10)

export function PersonalInfoPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: user?.role,
      dateOfBirth: user?.dateOfBirth ?? '',
      country: user?.country ?? '',
    },
  })

  const submit = useAsyncAction(async (values: ProfileValues) => {
    updateUser(await authApi.updateProfile(values))
    navigate(paths.onboardingInterests)
  })

  return (
    <AuthLayout hero="team">
      <div className="flex flex-col gap-gap-lg">
        <LogoLockup />

        <div className="flex flex-col gap-gap-md">
          <AuthHeading title="Setup your account" description="Enter your profile details" />

          <form noValidate onSubmit={handleSubmit(submit.run)} className="flex flex-col gap-gap-xl">
            <div className="flex flex-col gap-gap-sm">
              <SelectField
                label="Select role"
                placeholder="Select your role"
                options={ROLE_OPTIONS}
                icon={<AddressBook className="size-6" />}
                error={errors.role?.message}
                {...register('role')}
              />
              <DateField
                label="Date of birth"
                placeholder="Select Date of birth"
                autoComplete="bday"
                max={today}
                icon={<CalendarDots className="size-6" />}
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
              <SelectField
                label="Select your location"
                placeholder="Select Country"
                autoComplete="country"
                options={COUNTRY_OPTIONS}
                icon={<GlobeHemisphereWest className="size-6" />}
                error={errors.country?.message}
                {...register('country')}
              />
            </div>

            <FormAlert message={submit.error} />

            <Button type="submit" loading={submit.pending}>
              Finish
            </Button>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}
