import { Check } from '@phosphor-icons/react'
import { useState } from 'react'
import deleteIllustration from '@/assets/settings/delete-illustration.webp'
import { paths } from '@/app/paths'
import { Button, ConfirmDialog, useToast } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { SettingsSection } from '../components/SettingsSection'
import { useDeleteAccount } from '../hooks/queries'
import { DELETE_REASONS, type DeleteReason } from '../types'

/** Settings → Privacy → Delete Account. */
export function DeleteAccountPage() {
  const [reasons, setReasons] = useState<DeleteReason[]>([])
  const [confirming, setConfirming] = useState(false)
  const remove = useDeleteAccount()
  const { signOut } = useAuth()
  const toast = useToast()

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

      {confirming && (
        <ConfirmDialog
          open
          title="Delete your account?"
          message="This permanently deletes your profile, posts and projects. This can’t be undone."
          confirmLabel="Delete forever"
          loading={remove.isPending}
          onClose={() => setConfirming(false)}
          onConfirm={() =>
            remove.mutate(reasons, {
              onSuccess: () => {
                toast('Your account has been deleted')
                signOut()
              },
              onError: (error) => toast(getErrorMessage(error)),
            })
          }
        />
      )}
    </SettingsSection>
  )
}
