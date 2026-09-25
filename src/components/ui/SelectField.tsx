import { CaretDown } from '@phosphor-icons/react'
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { controlBoxClass } from './controlStyles'
import { FieldShell } from './FieldShell'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  placeholder: string
  options: readonly SelectOption[]
  icon?: ReactNode
  error?: string
}

/** Native select styled to match the design — accessible and mobile friendly. */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, placeholder, options, icon, error, id, className, value, defaultValue, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <FieldShell id={selectId} label={label} error={error} className={className}>
      <div className={cn(controlBoxClass, 'justify-between', error && 'border-red-500')}>
        {icon && (
          <span className="pointer-events-none flex size-6 shrink-0 items-center justify-center text-fg-muted">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          id={selectId}
          value={value}
          // Start on the placeholder option unless a value is supplied.
          defaultValue={value === undefined ? (defaultValue ?? '') : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={cn(
            'absolute inset-0 w-full cursor-pointer appearance-none rounded-control bg-transparent pr-10 text-body-m text-fg outline-none',
            icon ? 'pl-10' : 'pl-2',
            // Placeholder colour while nothing is selected.
            'has-[option[value=""]:checked]:text-fg-muted',
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface text-fg">
              {option.label}
            </option>
          ))}
        </select>
        <CaretDown aria-hidden className="pointer-events-none ml-auto size-6 shrink-0 text-fg-muted" />
      </div>
    </FieldShell>
  )
})
