import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'outline'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-green text-white hover:brightness-95 active:brightness-90',
  outline: 'border border-border-default bg-surface text-fg hover:bg-fg/[0.03]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, fullWidth = true, disabled, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex h-control items-center justify-center gap-2.5 rounded-control px-5 py-2.5',
        'text-center text-body-l font-semibold whitespace-nowrap transition',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
})
