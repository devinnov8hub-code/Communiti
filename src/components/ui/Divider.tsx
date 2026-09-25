import { cn } from '@/lib/cn'

/** Horizontal rule with an optional centred label ("Or", "Or Continue with"). */
export function Divider({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex w-full items-center gap-[7px]', className)}>
      <span aria-hidden className="h-px flex-1 bg-divider" />
      {label && <span className="shrink-0 text-body-s text-fg-muted">{label}</span>}
      <span aria-hidden className="h-px flex-1 bg-divider" />
    </div>
  )
}
