import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: ReactNode
  /** e.g. a "Try again" button. */
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-5 py-16 text-center', className)}>
      <p className="text-body-l font-semibold text-fg">{title}</p>
      {description && <p className="max-w-sm text-body-s text-fg-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
