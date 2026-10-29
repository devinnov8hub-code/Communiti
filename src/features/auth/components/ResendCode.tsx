import { useEffect, useState } from 'react'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authApi } from '../api/auth.service'
import type { PendingVerification } from '../types'

const COOLDOWN_SECONDS = 60

interface ResendCodeProps {
  pending: PendingVerification
  onResent?: () => void
}

/** "Didn’t get a code? Resend code" with a cooldown between requests. */
export function ResendCode({ pending, onResent }: ResendCodeProps) {
  // The first code was just sent, so start in cooldown. Counting down from a
  // fixed deadline keeps the timer accurate even when the tab is throttled.
  const [deadline, setDeadline] = useState(() => Date.now() + COOLDOWN_SECONDS * 1000)
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  const resend = useAsyncAction(async () => {
    const request = pending.flow === 'reset' ? authApi.forgotPassword : authApi.resendVerificationEmail
    await request(pending.email)
    setSent(true)
    setDeadline(Date.now() + COOLDOWN_SECONDS * 1000)
    onResent?.()
  })

  const waiting = secondsLeft > 0

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-body-m text-grey-50 dark:text-white">
        Didn’t get a code?{' '}
        <button
          type="button"
          onClick={() => resend.run()}
          disabled={waiting || resend.pending}
          className="text-brand-green hover:underline disabled:cursor-not-allowed disabled:text-fg-muted disabled:no-underline"
        >
          {resend.pending ? 'Sending…' : waiting ? `Resend code in ${formatTime(secondsLeft)}` : 'Resend code'}
        </button>
      </p>
      <p aria-live="polite" className="text-body-s">
        {resend.error ? (
          <span className="text-red-500">{resend.error}</span>
        ) : (
          sent && waiting && <span className="text-fg-muted">A new code has been sent to {pending.email}</span>
        )}
      </p>
    </div>
  )
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
