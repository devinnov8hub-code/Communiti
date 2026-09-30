import { cn } from '@/lib/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible name when there is no visible <label> pointing at it. */
  label: string
  disabled?: boolean
  className?: string
}

/** On/off toggle (Figma "Toggle"): orange track with a white knob. */
export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-[22px] w-[43px] shrink-0 items-center rounded-full p-[3px] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-brand-orange' : 'bg-grey-30 dark:bg-grey-40',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-4 w-[22px] rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[15px]' : 'translate-x-0',
        )}
      />
    </button>
  )
}
