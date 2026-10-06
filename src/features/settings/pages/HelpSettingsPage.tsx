import { useState, type FormEvent } from 'react'
import { Button, FieldError, useToast } from '@/components/ui'
import { controlBoxClass } from '@/components/ui/controlStyles'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { SettingsSection } from '../components/SettingsSection'
import { useSupportReport } from '../hooks/queries'

// TODO: replace with the real support contacts before launch.
const SUPPORT_EMAIL = 'support@yourplatform.com'
const WHATSAPP_URL = 'https://wa.me/'

/** Settings → Help & Support. */
export function HelpSettingsPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string>()
  const report = useSupportReport()
  const toast = useToast()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (message.trim().length < 10) return setError('Tell us a little more (at least 10 characters).')
    setError(undefined)
    report.mutate(message.trim(), {
      onSuccess: () => {
        setMessage('')
        toast('Thanks — your report has been sent')
      },
      onError: (err) => toast(getErrorMessage(err)),
    })
  }

  return (
    <SettingsSection title="Help & Support" className="gap-6 px-4 lg:pl-[26px]">
      <div className="flex flex-col gap-2 lg:max-w-[697px]">
        <h2 className="text-body-l font-semibold text-fg">Need assistance? We&apos;re here to help.</h2>
        <p className="text-body-l text-fg-muted">
          Find answers to common questions, get support, or report an issue with your account or the platform.
        </p>
      </div>
      <div className="flex flex-col gap-2 text-body-l text-fg">
        <h2 className="font-semibold">Contact Support</h2>
        <p>Need additional help? Our support team is ready to assist you.</p>
        <h3 className="font-semibold">📧 Email Support</h3>
        <p>
          Send us an Email with our address:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-orange-soft underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <h3 className="font-semibold">💬 Live Chat</h3>
        <p>
          Chat with our support team on whatsapp:{' '}
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-brand-orange-soft underline">
            whatsapplink.com
          </a>
        </p>
      </div>
      <form noValidate onSubmit={submit} className="flex flex-col gap-2 lg:max-w-[697px]">
        <label htmlFor="support-report" className="text-body-l font-semibold text-fg">
          Report an Issue or give us feedback
        </label>
        <textarea
          id="support-report"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Whats your report..."
          rows={8}
          aria-invalid={error ? true : undefined}
          className={cn(
            controlBoxClass,
            'h-auto min-h-[184px] resize-y items-start border-hairline py-2.5 text-body-s text-fg outline-none placeholder:text-fg-muted',
          )}
        />
        {error && <FieldError>{error}</FieldError>}
        <Button type="submit" loading={report.isPending} className="mt-7 h-[38px] rounded-full font-normal">
          Send report
        </Button>
      </form>
    </SettingsSection>
  )
}
