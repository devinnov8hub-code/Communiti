import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import changeRoleIllustration from '@/assets/settings/change-role.png'
import { Modal } from '@/components/ui'
import { DialogActions, DialogMessage } from './AccountDialogParts'

/** "Change Role" warning; the role screens themselves come next. */
export function ChangeRoleDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Modal open onClose={onClose} title="Change Role" gap="sm" className="[&_h2]:text-body-l">
      <img src={changeRoleIllustration} alt="" width={209} height={103} className="mx-auto mt-10" />
      <DialogMessage title="Are You Sure You Want to Change Your Role?">
        Changing your role will log you out of your account and require you to complete the verification process again.
        Your account will remain unverified until your new role and details have been reviewed and approved.
      </DialogMessage>
      <DialogActions onCancel={onClose} onContinue={() => navigate(paths.changeRole)} />
    </Modal>
  )
}
