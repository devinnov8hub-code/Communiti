import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface FieldShellProps {
  id: string
  label: string
  error?: string
  children: ReactNode
  className?: string
}

/** Label + control + error message wrapper shared by all form fields ("input filed" in Figma). */
export function FieldShell({ id, label, error, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      <label htmlFor={id} className="text-body-s text-fg-label">
        {label}
      </label>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="text-body-s text-red-500">
      {children}
    </p>
  )
}
