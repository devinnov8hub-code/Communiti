import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from './toastContext'

interface ToastItem {
  id: number
  message: string
}

/** Minimal toast stack for confirmations ("Link copied", "Post reported"…). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const toast = useCallback((message: string) => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, message }])
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3500)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((item) => (
          <p
            key={item.id}
            role="status"
            className="rounded-full bg-grey-50 px-5 py-2.5 text-body-s text-white shadow-popover dark:bg-white dark:text-grey-50"
          >
            {item.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
