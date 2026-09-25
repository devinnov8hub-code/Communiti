import { MagnifyingGlass } from '@phosphor-icons/react'
import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** `lg`: 54px outlined pill (page header). `sm`: 37px filled field (search modal). */
  size?: 'lg' | 'sm'
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { size = 'lg', className, placeholder = 'Search', ...props },
  ref,
) {
  return (
    <label
      className={cn(
        'flex w-full cursor-text items-center gap-2 px-2 py-[5px] transition-colors focus-within:border-brand-green',
        size === 'lg'
          ? 'h-[54px] rounded-full border border-grey-40/60'
          : 'h-[37px] rounded-search border border-transparent bg-surface',
        className,
      )}
    >
      <MagnifyingGlass aria-hidden className="size-3 shrink-0 text-fg" />
      <input
        ref={ref}
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-muted [&::-webkit-search-cancel-button]:hidden',
          size === 'lg' ? 'text-body-m' : 'text-caption',
        )}
        {...props}
      />
    </label>
  )
})
