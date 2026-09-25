import { CheckSquare, Square } from '@phosphor-icons/react'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { FieldError } from './FieldShell'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, id, className, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      <label htmlFor={inputId} className="flex w-full cursor-pointer items-center gap-1">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        <CheckSquare aria-hidden className="hidden size-6 shrink-0 text-brand-green peer-checked:block" />
        <Square aria-hidden className="block size-6 shrink-0 text-fg-muted peer-checked:hidden" />
        <span className="min-w-0 flex-1 rounded-sm text-body-s peer-focus-visible:outline-2 peer-focus-visible:outline-brand-green">
          {label}
        </span>
      </label>
      {error && <FieldError id={`${inputId}-error`}>{error}</FieldError>}
    </div>
  )
})
