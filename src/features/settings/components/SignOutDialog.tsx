import signOutIllustration from '@/assets/settings/signout-illustration.webp'
import { Modal } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'

/** "SignOut?" confirmation (Figma "sign out" modal). */
export function SignOutDialog({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuth()
  return (
    <Modal open onClose={onClose} title="SignOut?" gap="sm" className="max-w-[581px] rounded-card [&_h2]:text-h4">
      <img src={signOutIllustration} alt="" width={417} height={235} className="mx-auto h-auto w-full max-w-[417px]" />
      <p className="text-body-m text-fg">Are you sure you want to sign out? you’ll need to sign back in to continue.</p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-[38px] flex-1 rounded-full border border-border-default text-body-l text-fg hover:bg-fg/5"
        >
          No
        </button>
        <button
          type="button"
          onClick={signOut}
          className="h-[38px] flex-1 rounded-full bg-brand-orange text-body-l text-white hover:brightness-95"
        >
          Yes
        </button>
      </div>
    </Modal>
  )
}
