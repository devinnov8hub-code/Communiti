import { Star } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'

interface StarRatingProps {
  value: number
  max?: number
  /** Makes the stars clickable (evaluation form). Without it the rating is read-only. */
  onChange?: (value: number) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}

/** Five-star rating in System/Warning/40 (Figma expert evaluations). */
export function StarRating({ value, max = 5, onChange, label, size = 'sm', className }: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, index) => index + 1)
  const iconClass = size === 'sm' ? 'size-[13px]' : 'size-5'

  if (!onChange) {
    return (
      <span role="img" aria-label={`${label}: ${value} out of ${max}`} className={cn('flex gap-0.5', className)}>
        {stars.map((star) => (
          <Star
            key={star}
            aria-hidden
            weight={star <= value ? 'fill' : 'regular'}
            className={cn(iconClass, 'text-warning')}
          />
        ))}
      </span>
    )
  }

  return (
    <span role="radiogroup" aria-label={label} className={cn('flex gap-0.5', className)}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          className="rounded-sm p-0.5 transition hover:scale-110"
        >
          <Star weight={star <= value ? 'fill' : 'regular'} className={cn(iconClass, 'text-warning')} />
        </button>
      ))}
    </span>
  )
}
