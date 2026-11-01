import { User } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Modal, SelectField, TextField, useToast } from '@/components/ui'
import { ROLE_OPTIONS, USER_ROLES } from '@/features/auth/constants'
import { getErrorMessage } from '@/lib/api/errors'
import { useUpdateProfile } from '../hooks/queries'
import type { Profile } from '../types'
import { AvatarUpload } from './AvatarUpload'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60),
  role: z.enum(USER_ROLES, { error: 'Select your role' }),
  profession: z.string().trim().min(2, 'Enter your profession').max(60),
})
type Values = z.infer<typeof schema>

/** "Edit Profile" sheet. */
export function EditProfileModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [avatar, setAvatar] = useState<File>()
  const update = useUpdateProfile()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: profile.name, role: profile.role, profession: profile.profession },
  })

  const submit = handleSubmit((values) =>
    update.mutate(
      { ...values, avatar },
      {
        onSuccess: () => {
          toast('Profile updated')
          onClose()
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    ),
  )

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Profile"
      divided
      footer={
        <Button
          type="submit"
          form="edit-profile"
          loading={update.isPending}
          className="h-[38px] rounded-full bg-brand-orange font-normal"
        >
          Save
        </Button>
      }
    >
      <form id="edit-profile" noValidate onSubmit={submit} className="flex flex-col gap-gap-sm">
        <div className="flex items-center gap-5">
          <AvatarUpload src={profile.avatarUrl} name={profile.name} onSelect={setAvatar} />
          <p className="text-body-l font-semibold text-brand-orange">Tap Upload Image</p>
        </div>
        <div className="flex flex-col gap-2">
          <TextField
            label="Profile name"
            icon={<User className="size-6" />}
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
          <SelectField
            label="Role"
            placeholder="Select your role"
            options={ROLE_OPTIONS}
            error={errors.role?.message}
            {...register('role')}
          />
          <TextField
            label="Enter your profession"
            placeholder="Engineer"
            autoComplete="organization-title"
            error={errors.profession?.message}
            {...register('profession')}
          />
        </div>
      </form>
    </Modal>
  )
}
