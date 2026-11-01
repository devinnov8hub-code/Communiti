import { EnvelopeSimple } from '@phosphor-icons/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import changeEmailIllustration from '@/assets/settings/change-email.svg'
import { Button, Modal, TextField, useToast, VerifyTick } from '@/components/ui'
import { FormAlert } from '@/features/auth/components/FormAlert'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toUser } from '@/features/auth/user'
import { ApiError, getErrorMessage, meApi } from '@/lib/api'
import { settingsKeys } from '../hooks/queries'
import { changeEmailBody, type RoleEmail } from '../roleEmails'
import { DialogActions, DialogMessage } from './AccountDialogParts'

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your new email').email('Enter a valid email address'),
})
type Values = z.infer<typeof schema>

/** "Change institutional email" (and work / student): a warning, then the new address, which the server checks. */
export function ChangeEmailDialog({ email, onClose }: { email: RoleEmail; onClose: () => void }) {
  const client = useQueryClient()
  const toast = useToast()
  const { updateUser } = useAuth()
  const [confirmed, setConfirmed] = useState(false)
  const [verified, setVerified] = useState(false)
  const label = email.label.toLowerCase()
  const warning = `Changing your ${label} address will require you to go through the verification process again. Your account will remain unverified until your new details have been approved.`

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const change = useMutation({
    mutationFn: (values: Values) => meApi.submitRole(changeEmailBody(email, values.email)),
    onSuccess: async (updated) => {
      client.setQueryData(settingsKeys.account, updated)
      updateUser(toUser(updated))
      const isVerified = updated.verificationStatus === 'verified'
      if (isVerified) {
        setVerified(true)
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
      toast(isVerified ? 'Your new email is verified' : 'Your new email has been sent for review')
      onClose()
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.fields?.[`details.${email.field}`] : undefined
      if (message) setError('email', { message: [message].flat().join(' ') })
    },
  })

  return (
    <Modal open onClose={onClose} title={`Change ${label}`} gap="sm" className="[&_h2]:text-body-l">
      <img src={changeEmailIllustration} alt="" width={209} height={111} className="mx-auto mt-8" />
      {confirmed ? (
        <form noValidate onSubmit={handleSubmit((values) => change.mutate(values))} className="flex flex-col gap-2.5">
          <p className="text-body-s text-fg">{warning}</p>
          <TextField
            label={`New ${label}`}
            type="email"
            autoComplete="email"
            autoFocus
            placeholder={email.placeholder}
            icon={<EnvelopeSimple className="size-6" />}
            trailing={<VerifyTick active={verified} />}
            error={errors.email?.message}
            {...register('email')}
          />
          <FormAlert message={change.error ? getErrorMessage(change.error) : null} />
          {(change.isPending || verified) && (
            <p role="status" className="text-center text-body-s text-fg-muted">
              {verified ? 'Verified' : 'Verifying your details…'}
            </p>
          )}
          <Button
            type="submit"
            loading={change.isPending || verified}
            className="mt-6 rounded-full bg-brand-orange font-normal"
          >
            Submit
          </Button>
        </form>
      ) : (
        <>
          <DialogMessage title={`Change ${email.label}?`}>{warning}</DialogMessage>
          <DialogActions onCancel={onClose} onContinue={() => setConfirmed(true)} />
        </>
      )}
    </Modal>
  )
}
