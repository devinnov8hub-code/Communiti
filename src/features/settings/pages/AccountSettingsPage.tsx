import { AddressBook, EnvelopeSimple, NavigationArrow, User } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { TextAreaField, TextField, VerifyTick } from '@/components/ui'
import { getRoleLabel, toUser } from '@/features/auth/user'
import type { Me } from '@/lib/api'
import { ChangeEmailDialog } from '../components/ChangeEmailDialog'
import { ChangeRoleDialog } from '../components/ChangeRoleDialog'
import { SettingsSection } from '../components/SettingsSection'
import { useAccount } from '../hooks/queries'
import { getRoleEmail } from '../roleEmails'

/** Settings → Account Preferences. Details are changed through the dialogs, which verify them again. */
export function AccountSettingsPage() {
  const account = useAccount()
  return (
    <SettingsSection title="Account Preferences">
      {account.data ? (
        <AccountDetails me={account.data} />
      ) : (
        <div className="h-80 animate-pulse rounded-card bg-surface" />
      )}
    </SettingsSection>
  )
}

function AccountDetails({ me }: { me: Me }) {
  const [dialog, setDialog] = useState<'role' | 'email' | null>(null)
  const researcher = me.memberRole === 'researcher'
  const email = getRoleEmail(me)
  const verified = me.verificationStatus === 'verified'

  return (
    <div className="flex flex-col gap-3.5">
      <Group title="Account Information">
        <div className="grid gap-x-[30px] gap-y-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <TextField
              label="Role"
              value={getRoleLabel(toUser(me))}
              readOnly
              icon={<AddressBook className="size-6" />}
              trailing={<VerifyTick active={verified} />}
            />
            <div className="flex items-start justify-between gap-3">
              <VerificationStatus me={me} />
              <ChangeLink onClick={() => setDialog('role')}>Change my role</ChangeLink>
            </div>
          </div>
          <TextField
            label="Location"
            value={me.location ?? ''}
            readOnly
            disabled
            icon={<NavigationArrow className="size-6 -scale-x-100" />}
          />
        </div>
      </Group>

      <Group title="Personal">
        <div className="grid gap-x-[17px] gap-y-2 sm:grid-cols-2">
          <TextField label="Email" value={me.email} readOnly disabled icon={<User className="size-6" />} />
          {email && (
            <div className="flex flex-col gap-1">
              <TextField
                label={email.label}
                value={email.value}
                readOnly
                icon={<EnvelopeSimple className="size-6" />}
                trailing={<VerifyTick active={verified && Boolean(email.value)} />}
              />
              <ChangeLink onClick={() => setDialog('email')}>Change this email</ChangeLink>
            </div>
          )}
        </div>
        {researcher && (
          <TextAreaField
            label="Evidence of research"
            value={me.researchEvidence ?? ''}
            readOnly
            disabled
            inputClassName="min-h-[116px] resize-none"
          />
        )}
      </Group>

      {dialog === 'role' && <ChangeRoleDialog onClose={() => setDialog(null)} />}
      {dialog === 'email' && email && <ChangeEmailDialog email={email} onClose={() => setDialog(null)} />}
    </div>
  )
}

/** Where the role form stands. `reviewNote` is the reason when an admin rejected or revoked it. */
function VerificationStatus({ me }: { me: Me }) {
  if (me.verificationStatus === 'pending') return <p className="text-body-s text-fg-muted">Pending review</p>
  if (me.verificationStatus === 'verified') return <p className="text-body-s text-brand-green">Verified</p>
  if (me.verificationStatus === 'rejected') {
    return <p className="text-body-s text-red-500">{me.verification?.reviewNote ?? 'Not approved'}</p>
  }
  return <span />
}

function ChangeLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 self-end text-body-s text-brand-orange hover:underline">
      {children}
    </button>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5 [&_input:disabled]:text-grey-30 [&_textarea:disabled]:text-fg-muted">
      <h2 className="text-body-l font-semibold text-fg">{title}</h2>
      {children}
    </section>
  )
}
