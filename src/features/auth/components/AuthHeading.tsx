import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface AuthHeadingProps {
  title: ReactNode
  description?: ReactNode
  /** Description colour differs per screen in the design. */
  descriptionTone?: 'muted' | 'body'
  className?: string
}

export function AuthHeading({ title, description, descriptionTone = 'muted', className }: AuthHeadingProps) {
  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <h1 className="text-title-sm font-bold text-fg sm:text-head2">{title}</h1>
      {description && (
        <p
          className={cn(
            'text-body-m sm:text-body-l',
            descriptionTone === 'muted' ? 'text-fg-muted dark:text-fg-body' : 'text-fg-body',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
