import { useId, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem<T extends string> {
  value: T
  label: string
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[]
  value: T
  onChange: (value: T) => void
  /** Underline colour — the feed uses orange, search results use green. */
  accent?: 'orange' | 'green'
  label: string
  className?: string
}

/** Equal-width underline tabs ("For You / Following", "Posts / People / …"). */
export function Tabs<T extends string>({ items, value, onChange, accent = 'orange', label, className }: TabsProps<T>) {
  const id = useId()

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!offset) return
    event.preventDefault()
    const next = items[(index + offset + items.length) % items.length]
    onChange(next.value)
    document.getElementById(`${id}-${next.value}`)?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={cn('flex w-full items-center gap-gap-md', className)}>
      {items.map((item, index) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            id={`${id}-${item.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center border-b-3 border-transparent p-2 text-body-m whitespace-nowrap text-fg transition-colors',
              selected ? (accent === 'orange' ? 'border-brand-orange' : 'border-brand-green') : 'hover:border-hairline',
            )}
          >
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
