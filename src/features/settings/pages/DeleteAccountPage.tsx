import { Check } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import deleteIllustration from '@/assets/settings/delete-illustration.webp'
import { paths } from '@/app/paths'
import { Button, Modal, PasswordField, useToast } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { SettingsSection } from '../components/SettingsSection'
import { useAccount, useDeleteAccount } from '../hooks/queries'
import { DELETE_REASONS, type DeleteReason } from '../types'

/** Settings → Privacy → Delete Account. */
export function DeleteAccountPage() {
  const [reasons, setReasons] = useState<DeleteReason[]>([])
  const [confirming, setConfirming] = useState(false)

  const toggle = (reason: DeleteReason) =>
    setReasons((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason],
    )

  return (
    <SettingsSection
      title="Delete Account"
      backTo={paths.settingsSection('privacy')}
      className="items-center gap-6 lg:pl-[26px]"
    >
      <img src={deleteIllustration} alt="" width={182} height={128} className="h-32 w-auto" />
      <div className="flex w-full flex-col gap-4 text-body-s text-fg">
        <p>
          We&apos;re sorry to see you go.
          <br />
          Deleting your account is permanent and cannot be undone. Once your account is deleted, you will lose access to
          your profile, projects, discussions, saved content, and any associated data.
        </p>
        <p>Before you leave, we&apos;d appreciate your feedback to help us improve.</p>
      </div>

      <fieldset className="flex w-full flex-col gap-2">
        <legend className="sr-only">Why are you leaving?</legend>
        {DELETE_REASONS.map((reason) => {
          const checked = reasons.includes(reason)
          return (
            <label
              key={reason}
              className="flex cursor-pointer items-center gap-4 border-b border-hairline last:border-b-0"
            >
              <span className="flex size-12 shrink-0 items-center justify-center">
                <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => toggle(reason)} />
                <span
                  aria-hidden
                  className={cn(
                    'flex size-[18px] items-center justify-center rounded-[2px] border-2 transition-colors',
                    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-green',
                    checked ? 'border-brand-green bg-brand-green text-white' : 'border-fg',
                  )}
                >
                  {checked && <Check weight="bold" className="size-3" />}
                </span>
              </span>
              <span className="text-body-s text-fg">{reason}</span>
            </label>
          )
        })}
      </fieldset>

      <div className="w-full rounded-card bg-popover px-[30px] py-2 pb-6">
        <Button onClick={() => setConfirming(true)} className="h-[38px] rounded-full bg-error font-normal">
          Delete account
        </Button>
      </div>

      {confirming && <ConfirmDeleteDialog reasons={reasons} onClose={() => setConfirming(false)} />}
    </SettingsSection>
  )
}

/**
 * Final step. The backend schedules deletion in 30 days and signs out everywhere; signing in
 * again before then cancels it. Accounts with a password (not Google-only) must enter it.
 */
function ConfirmDeleteDialog({ reasons, onClose }: { reasons: DeleteReason[]; onClose: () => void }) {
  const account = useAccount()
  const remove = useDeleteAccount()
  const { signOut } = useAuth()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const needsPassword = account.data?.hasPassword ?? true

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (needsPassword && !password) return setError('Enter your password to confirm')
    remove.mutate(
      { reasons, password: needsPassword ? password : undefined },
      {
        onSuccess: () => {
          toast('Your account will be deleted in 30 days')
          signOut()
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    )
  }

  return (
    <Modal open onClose={onClose} title="Delete your account?" className="max-w-[440px]">
      <form noValidate onSubmit={submit} className="flex flex-col gap-gap-sm">
        <p className="text-body-m text-fg-muted">
          You&apos;ll be signed out everywhere and your profile, posts and projects will be deleted permanently in 30
          days. Signing in again before then cancels the deletion.
        </p>
        {needsPassword && (
          <PasswordField
            label="Password"
            autoComplete="current-password"
            maxLength={128}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError(undefined)
            }}
            error={error}
          />
        )}
        {!needsPassword && error && (
          <p role="alert" className="text-body-s text-error">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="h-[38px] rounded-full text-body-m" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="h-[38px] rounded-full bg-error text-body-m" loading={remove.isPending}>
            Delete account
          </Button>
        </div>
      </form>
    </Modal>
  )
}
