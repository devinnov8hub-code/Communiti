import { useCallback, useState } from 'react'
import { getErrorMessage } from '@/lib/api/client'

/** Tracks loading + error state for a one-off async action (e.g. a form submit). */
export function useAsyncAction<Args extends unknown[]>(action: (...args: Args) => Promise<void>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (...args: Args) => {
      setPending(true)
      setError(null)
      try {
        await action(...args)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setPending(false)
      }
    },
    [action],
  )

  return { run, pending, error, setError }
}
