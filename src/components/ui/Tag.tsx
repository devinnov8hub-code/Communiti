import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type TagTone = 'success' | 'info' | 'warning' | 'orange'

const tones: Record<TagTone, string> = {
  success: 'bg-success-tint text-success-strong',
  info: 'bg-info-tint text-info-strong',
  warning: 'bg-warning-tint text-warning-strong',
  orange: 'bg-brand-orange-tint text-brand-orange',
}

interface TagProps {
  tone?: TagTone
  children: ReactNode
  className?: string
}

/** Tinted pill used for topics and statuses ("Filter Pills" in Figma). */
export function Tag({ tone = 'orange', children, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full p-2 whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
