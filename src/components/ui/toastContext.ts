import { createContext, useContext } from 'react'

export const ToastContext = createContext<{ toast: (message: string) => void } | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within <ToastProvider>')
  return context.toast
}
