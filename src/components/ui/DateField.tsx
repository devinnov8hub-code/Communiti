import { CaretDown } from '@phosphor-icons/react'
import {
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'
import { controlBoxClass } from './controlStyles'
import { FieldShell } from './FieldShell'

export interface DateFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  placeholder: string
  icon?: ReactNode
  error?: string
}

/**
 * Native date input that shows the design's placeholder ("Select Date of birth")
 * until a value is picked. Clicking anywhere on the field opens the picker.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { label, placeholder, icon, error, id, className, onChange, onFocus, onBlur, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const [hasValue, setHasValue] = useState(Boolean(props.value ?? props.defaultValue))
  const [focused, setFocused] = useState(false)
  const showPlaceholder = !hasValue && !focused

  const openPicker = () => {
    try {
      inputRef.current?.showPicker()
    } catch {
      inputRef.current?.focus()
    }
  }

  return (
    <FieldShell id={inputId} label={label} error={error} className={className}>
      <div
        className={cn(controlBoxClass, 'cursor-pointer justify-between', error && 'border-red-500')}
        onClick={openPicker}
      >
        {icon && (
          <span className="pointer-events-none flex size-6 shrink-0 items-center justify-center text-fg-muted">
            {icon}
          </span>
        )}
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            id={inputId}
            type="date"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              'w-full cursor-pointer bg-transparent text-body-m text-fg outline-none',
              '[&::-webkit-calendar-picker-indicator]:hidden',
              showPlaceholder && 'text-transparent',
            )}
            onChange={(event) => {
              setHasValue(event.target.value !== '')
              onChange?.(event)
            }}
            onFocus={(event) => {
              setFocused(true)
              onFocus?.(event)
            }}
            onBlur={(event) => {
              setFocused(false)
              onBlur?.(event)
            }}
            {...props}
          />
          {showPlaceholder && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-body-m text-fg-muted"
            >
              {placeholder}
            </span>
          )}
        </div>
        <CaretDown aria-hidden className="pointer-events-none size-6 shrink-0 text-fg-muted" />
      </div>
    </FieldShell>
  )
})
