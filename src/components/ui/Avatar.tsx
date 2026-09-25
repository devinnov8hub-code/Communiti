import { useState, type CSSProperties } from 'react'
import { cn } from '@/lib/cn'

interface AvatarProps {
  src?: string
  name: string
  /** Pixel size — the design uses 36, 40, 46 and 58. */
  size?: number
  className?: string
}

/** Round profile picture with an initials fallback. */
export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <span
      className={cn(
        'inline-flex size-(--avatar-size) shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-brand-orange-tint text-[calc(var(--avatar-size)*0.38)] font-semibold text-brand-orange',
        className,
      )}
      style={{ '--avatar-size': `${size}px` } as CSSProperties}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label={name}>{initials}</span>
      )}
    </span>
  )
}
