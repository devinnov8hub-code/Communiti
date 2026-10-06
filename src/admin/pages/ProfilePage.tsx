import { zodResolver } from '@hookform/resolvers/zod'
import { FloppyDisk, Key, UploadSimple } from '@phosphor-icons/react'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ActionButton, Avatar, Button, FieldError, TextField, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { adminApi } from '../api/admin.service'
import { AdminTopBar } from '../components/AdminTopBar'
import { AdminContent, Panel } from '../components/ui'
import { useAdminSession } from '../session/adminSessionContext'
import type { AdminUser } from '../types'

const MAX_PHOTO = 2 * 1024 * 1024

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name').max(50),
  lastName: z.string().trim().min(1, 'Enter your last name').max(50),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?\d[\d\s-]{6,})?$/, 'Enter a valid phone number')
    .optional(),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Use at least 8 characters'),
  })
  .refine((values) => values.oldPassword !== values.newPassword, {
    path: ['newPassword'],
    message: 'Choose a password you haven’t used here',
  })
type PasswordValues = z.infer<typeof passwordSchema>

/** Admin profile & password (Figma "SETTINGS" › Profile). */
export function ProfilePage() {
  const { admin } = useAdminSession()
  return (
    <>
      <AdminTopBar title="Profile" />
      <AdminContent>
        <Panel className="flex max-w-[1104px] flex-col gap-gap-md px-3.5 py-5 sm:px-[13px]">
          {admin && <ProfileForm admin={admin} />}
          <PasswordForm />
        </Panel>
      </AdminContent>
    </>
  )
}

function ProfileForm({ admin }: { admin: AdminUser }) {
  const { updateAdmin } = useAdminSession()
  const toast = useToast()
  const photoId = useId()
  const [photo, setPhoto] = useState<File | null | undefined>(undefined)
  const [photoError, setPhotoError] = useState<string>()
  const [preview, setPreview] = useState<string>()
  const [saving, setSaving] = useState(false)
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview])

  const defaults = {
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    phone: admin.phone ?? '',
  }
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: defaults })

  const avatarSrc = photo === null ? undefined : (preview ?? admin.avatarUrl)
  const changed = isDirty || photo !== undefined

  const discard = () => {
    reset(defaults)
    setPhoto(undefined)
    setPreview(undefined)
    setPhotoError(undefined)
  }

  const submit = handleSubmit(async (values) => {
    setSaving(true)
    try {
      const updated = await adminApi.updateProfile({ ...values, avatar: photo })
      updateAdmin(updated)
      reset({ ...values })
      setPhoto(undefined)
      setPreview(undefined)
      toast('Profile saved')
    } catch (error) {
      toast(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  })

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4 border-b border-hairline pb-6">
      <h2 className="text-body-l font-semibold text-fg">Profile information</h2>
      <div className="flex flex-col gap-1">
        <p className="text-body-s font-semibold text-fg">Profile Photo</p>
        <p className="text-caption text-fg-muted">JPG, PNG or GIF. Max size of 2MB.</p>
      </div>
      <div className="flex flex-wrap items-center gap-gap-md border-b border-hairline pb-4">
        <Avatar src={avatarSrc} name={`${admin.firstName} ${admin.lastName}`} size={106} />
        <label
          htmlFor={photoId}
          className="flex cursor-pointer items-center gap-2 rounded-control border border-hairline bg-surface-raised px-5 py-2.5 text-body-m font-semibold text-fg hover:bg-fg/[0.03] dark:border-border-default"
        >
          <UploadSimple aria-hidden className="size-5" />
          Upload Photo
        </label>
        <input
          id={photoId}
          type="file"
          accept="image/png,image/jpeg,image/gif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            if (file.size > MAX_PHOTO) return setPhotoError('Photos must be 2MB or smaller')
            setPhotoError(undefined)
            setPhoto(file)
            setPreview(URL.createObjectURL(file))
          }}
        />
        {avatarSrc && (
          <button
            type="button"
            onClick={() => {
              setPhoto(null)
              setPreview(undefined)
            }}
            className="text-body-m font-semibold text-error hover:underline"
          >
            Remove
          </button>
        )}
        {photoError && <FieldError>{photoError}</FieldError>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="First name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <TextField
          label="Last Name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
        <TextField
          label="Email Address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Phone Number(optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+ 234"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          fullWidth={false}
          disabled={!changed || saving}
          onClick={discard}
          className="h-[42px] text-body-m"
        >
          Discard changes
        </Button>
        <ActionButton
          type="submit"
          disabled={!changed || saving}
          icon={<FloppyDisk aria-hidden className="size-5" />}
          className="py-2.5"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </ActionButton>
      </div>
    </form>
  )
}

function PasswordForm() {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '' },
  })

  const submit = handleSubmit(async (values) => {
    setSaving(true)
    try {
      await adminApi.changePassword(values.oldPassword, values.newPassword)
      reset()
      toast('Password changed')
    } catch (error) {
      toast(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  })

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="text-body-l font-semibold text-fg">Change Password</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Old password"
          type="password"
          autoComplete="current-password"
          error={errors.oldPassword?.message}
          {...register('oldPassword')}
        />
        <TextField
          label="New Password"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
      </div>
      <ActionButton
        type="submit"
        disabled={saving}
        icon={<Key aria-hidden className="size-5" />}
        className="self-end py-2.5"
      >
        {saving ? 'Changing…' : 'Change password'}
      </ActionButton>
    </form>
  )
}
