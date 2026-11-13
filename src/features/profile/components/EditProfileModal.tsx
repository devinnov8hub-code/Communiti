import { User } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { paths } from '@/app/paths'
import { Button, Modal, TextField, useToast } from '@/components/ui'
import { getRoleLabel } from '@/features/auth/user'
import { getErrorMessage } from '@/lib/api/errors'
import { useUpdateProfile } from '../hooks/queries'
import type { Profile } from '../types'
import { AvatarUpload } from './AvatarUpload'

// Limits from the backend: fullName 2–80 characters.
const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80, 'Keep your name under 80 characters'),
  profession: z.string().trim().max(80, 'Keep it under 80 characters'),
})
type Values = z.infer<typeof schema>

/**
 * "Edit Profile" sheet. The role is shown but not edited here: changing it goes through the
 * verified role form (Settings → Account Preferences), so it links there instead.
 */
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
    defaultValues: { name: profile.name, profession: profile.profession },
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
          <div className="flex flex-col gap-1">
            <span className="text-body-s text-fg">Role</span>
            <div className="flex items-center justify-between gap-3 rounded-control border border-border-default px-3 py-2.5">
              <span className="text-body-m text-fg">{getRoleLabel(profile)}</span>
              <Link to={paths.changeRole} onClick={onClose} className="text-body-s text-brand-green hover:underline">
                Change role
              </Link>
            </div>
          </div>
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
