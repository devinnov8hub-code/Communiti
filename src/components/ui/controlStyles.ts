import { cn } from '@/lib/cn'

/** Visual styles for the input "box" in the design. */
export const controlBoxClass = cn(
  'relative flex h-control w-full items-center gap-2 rounded-control px-2 py-[5px]',
  'border border-border-input/40 bg-surface transition-colors',
  'focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green',
)

export const controlInputClass =
  'min-w-0 flex-1 bg-transparent text-body-m text-fg outline-none placeholder:text-fg-muted'
