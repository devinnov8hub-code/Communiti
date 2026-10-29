import { X } from '@phosphor-icons/react'
import { useEffect, type ReactNode } from 'react'
import { IconButton, Spinner } from '@/components/ui'
import { cn } from '@/lib/cn'

/**
 * Right-hand panel (Figma "Review Report", "User details"). Inline beside the page on
 * wide screens, a slide-over sheet below xl. Escape closes it unless `lockEscape`
 * (e.g. while a dialog on top of it is open).
 */
export function SidePanel({
  title,
  label,
  onClose,
  lockEscape,
  children,
}: {
  title: string
  /** Accessible name, e.g. "Review report #2341". */
  label: string
  onClose: () => void
  lockEscape?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && !lockEscape && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, lockEscape])

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-30 bg-black/40 xl:hidden" aria-hidden />
      <aside
        aria-label={label}
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-[min(396px,100vw)] flex-col gap-gap-sm overflow-y-auto bg-surface-raised px-5 py-[22px] shadow-popover',
          'xl:sticky xl:top-0 xl:z-auto xl:h-dvh xl:shrink-0 xl:rounded-l-modal xl:shadow-none',
        )}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-body-l font-semibold text-fg">{title}</h2>
          <IconButton label={`Close ${title.toLowerCase()}`} onClick={onClose} className="size-[22px] text-fg">
            <X className="size-[22px]" />
          </IconButton>
        </div>
        {children}
      </aside>
    </>
  )
}

/** Centred spinner while the panel's details load. */
export function PanelLoading() {
  return (
    <div className="flex justify-center py-16">
      <Spinner className="size-6 text-brand-orange" />
    </div>
  )
}

/** Orange section heading with a hairline (Figma "Report Details" / "Report History"). */
export function DetailSection({
  title,
  divider,
  action,
  children,
}: {
  title: string
  divider: 'top' | 'bottom'
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          'flex items-center justify-between border-hairline',
          divider === 'bottom' ? 'border-b pb-1.5' : 'border-t pt-1.5',
        )}
      >
        <p className="text-body-m font-semibold text-brand-orange-glow">{title}</p>
        {action}
      </div>
      <dl className="flex flex-col gap-gap-sm text-body-m">{children}</dl>
    </div>
  )
}

export function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-fg">{label}</dt>
      <dd className={cn('text-fg-muted', valueClassName)}>{value}</dd>
    </div>
  )
}
