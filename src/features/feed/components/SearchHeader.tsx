import { MagnifyingGlass } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { SearchModal } from './SearchModal'

interface SearchHeaderProps {
  /** Tab row under the search field. Without it the header gets the "no tabs" bottom padding. */
  children?: ReactNode
  /** Constrain the search field (Settings uses 668px). */
  searchClassName?: string
}

/**
 * Sticky page header with the search trigger and a tab row (Figma "header"),
 * shared by Home, Projects and other list pages.
 */
export function SearchHeader({ children, searchClassName }: SearchHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header
      className={cn(
        'sticky top-14 z-10 flex flex-col gap-6 border-b border-hairline bg-background px-4 pt-2.5 sm:gap-9 sm:px-5 md:top-0',
        !children && 'pb-5',
      )}
    >
      {/* Looks like the search field; opens the search dialog. */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className={cn(
          'flex h-[54px] w-full items-center gap-2 rounded-full border border-grey-40/60 px-2 py-[5px] text-left text-body-m text-fg-muted hover:border-grey-40',
          searchClassName,
        )}
      >
        <MagnifyingGlass aria-hidden className="size-3 text-fg" />
        Search
      </button>
      {children}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
