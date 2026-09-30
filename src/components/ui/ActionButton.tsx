import { Plus } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Leading icon; defaults to a plus ("+ Add Event", "+ New Document"). */
  icon?: ReactNode
}

/** Orange page-level action button (Figma "+ New Document", "+ Add Event"). */
export function ActionButton({ icon, className, children, type = 'button', ...props }: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex items-center justify-center gap-2.5 rounded-control bg-brand-orange px-5 py-[15px] text-body-m font-semibold text-white transition hover:brightness-95 disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {icon ?? <Plus aria-hidden className="size-5" />}
      {children}
    </button>
  )
}
