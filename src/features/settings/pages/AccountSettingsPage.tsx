import { AddressBook, Briefcase, CalendarDots, GraduationCap, User } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, DateField, SelectField, TextField, useToast } from '@/components/ui'
import { COUNTRY_OPTIONS, ROLE_OPTIONS } from '@/features/auth/constants'
import { getErrorMessage } from '@/lib/api/errors'
import { SettingsSection } from '../components/SettingsSection'
import { useAccountSettings, useUpdateAccountSettings } from '../hooks/queries'
import type { AccountSettings } from '../types'

const schema = z.object({
  dateOfBirth: z.string(),
  country: z.string().min(1, 'Select your country'),
  city: z.string().trim().max(80),
  education: z.string().trim().max(80),
  role: z.enum(['artisan', 'expert', 'researcher'], { error: 'Select your role' }),
  profession: z.string().trim().min(2, 'Enter your profession').max(60),
})
type Values = z.infer<typeof schema>

/** Settings → Account Preferences. */
export function AccountSettingsPage() {
  const account = useAccountSettings()
  return (
    <SettingsSection title="Account Preferences">
      {account.data ? (
        <AccountForm account={account.data} />
      ) : (
        <div className="h-80 animate-pulse rounded-card bg-surface" />
      )}
    </SettingsSection>
  )
}

function AccountForm({ account }: { account: AccountSettings }) {
  const update = useUpdateAccountSettings()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: account })

  const submit = handleSubmit((values) =>
    update.mutate(values, {
      onSuccess: (saved) => {
        reset(saved)
        toast('Account preferences saved')
      },
      onError: (error) => toast(getErrorMessage(error)),
    }),
  )

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-gap-sm">
      <Group title="Personal">
        <TextField label="Email" value={account.email} readOnly disabled icon={<User className="size-6" />} />
        <DateField
          label="Date of birth"
          placeholder="Select Date of birth"
          max={new Date().toISOString().slice(0, 10)}
          icon={<CalendarDots className="size-6" />}
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth')}
        />
      </Group>
      <Group title="Location">
        <SelectField
          label="Country/Region"
          placeholder="Select Country"
          options={COUNTRY_OPTIONS}
          error={errors.country?.message}
          {...register('country')}
        />
        <TextField label="City" placeholder="e.g Abuja" error={errors.city?.message} {...register('city')} />
      </Group>
      <Group title="Account Information">
        <TextField
          label="Education"
          placeholder="e.g Bsc."
          icon={<GraduationCap className="size-6" />}
          error={errors.education?.message}
          {...register('education')}
        />
        <SelectField
          label="Role"
          placeholder="Select your role"
          options={ROLE_OPTIONS}
          icon={<AddressBook className="size-6" />}
          error={errors.role?.message}
          {...register('role')}
        />
        <TextField
          label="Profession"
          placeholder="e.g Engineer"
          icon={<Briefcase className="size-6" />}
          error={errors.profession?.message}
          {...register('profession')}
        />
      </Group>
      <Button
        type="submit"
        disabled={!isDirty}
        loading={update.isPending}
        className="mt-4 h-[38px] rounded-full bg-brand-orange font-normal sm:mx-[30px] sm:w-auto"
      >
        Save
      </Button>
    </form>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-gap-sm">
      <legend className="mb-3.5 text-body-l font-semibold text-fg">{title}</legend>
      <div className="grid gap-2 sm:grid-cols-2 [&_input:disabled]:text-grey-30">{children}</div>
    </fieldset>
  )
}
