import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { controlBoxClass, controlInputClass } from './controlStyles'
import { FieldShell } from './FieldShell'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, icon, error, id, className, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <FieldShell id={inputId} label={label} error={error} className={className}>
      <div className={cn(controlBoxClass, error && 'border-red-500')}>
        {icon && <span className="flex size-6 shrink-0 items-center justify-center text-fg-muted">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={controlInputClass}
          {...props}
        />
      </div>
    </FieldShell>
  )
})
