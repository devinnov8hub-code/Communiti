import { Eye, EyeSlash } from '@phosphor-icons/react'
import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { controlBoxClass, controlInputClass } from './controlStyles'
import { FieldShell } from './FieldShell'

export interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

/** Password input with the design's eye icon to show / hide what was typed. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, error, id, className, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeSlash : Eye

  return (
    <FieldShell id={inputId} label={label} error={error} className={className}>
      <div className={cn(controlBoxClass, error && 'border-red-500')}>
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-fg-muted hover:text-fg"
        >
          <Icon className="size-6" />
        </button>
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={controlInputClass}
          {...props}
        />
      </div>
    </FieldShell>
  )
})
