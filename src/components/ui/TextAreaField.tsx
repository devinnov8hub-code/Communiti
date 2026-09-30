import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { controlBoxClass } from './controlStyles'
import { FieldShell } from './FieldShell'

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  /** Extra classes for the textarea itself (height etc.). */
  inputClassName?: string
}

/** Multi-line "input filed" (Figma), sharing the text field's box styles. */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, id, className, inputClassName, rows = 5, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <FieldShell id={inputId} label={label} error={error} className={className}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          controlBoxClass,
          'h-auto min-h-[120px] resize-y items-start py-[5px] text-body-m text-fg outline-none placeholder:text-fg-muted',
          error && 'border-red-500',
          inputClassName,
        )}
        {...props}
      />
    </FieldShell>
  )
})
