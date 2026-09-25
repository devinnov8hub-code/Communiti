import { Plus, X } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface PillProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  label: string
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
}

/** Toggleable topic chip ("Filter Pills" in Figma). */
export function Pill({ label, selected = false, onSelectedChange, className, ...props }: PillProps) {
  const Icon = selected ? X : Plus

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelectedChange?.(!selected)}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full p-2 text-left text-body-m transition-colors sm:text-body-l',
        selected
          ? 'bg-brand-orange-soft text-white'
          : 'border-[0.3px] border-border-pill bg-surface text-fg hover:border-brand-orange-soft',
        className,
      )}
      {...props}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  )
}
