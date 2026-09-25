import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '@/lib/cn'

type TriggerProps = {
  ref?: Ref<HTMLButtonElement>
  onClick?: () => void
  'aria-haspopup'?: 'menu'
  'aria-expanded'?: boolean
  'aria-controls'?: string
}

interface MenuProps {
  trigger: ReactElement<TriggerProps>
  children: (close: () => void) => ReactNode
  align?: 'start' | 'end'
  /** Optional heading, e.g. "Chat actions" / "Sort by". */
  title?: string
  className?: string
}

/** Dropdown menu anchored to its trigger ("posts BSheet", "sort comments" in Figma). */
export function Menu({ trigger, children, align = 'end', title, className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    // Move focus into the menu for keyboard users.
    rootRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus()
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]'))
    const index = items.indexOf(document.activeElement as HTMLElement)
    const next = items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]
    next?.focus()
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      {cloneElement(trigger, {
        ref: triggerRef,
        onClick: () => setOpen((value) => !value),
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
      })}
      {open && (
        <div
          id={menuId}
          role="menu"
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute top-full z-30 mt-2 w-[250px] rounded-control bg-popover px-5 py-3.5 text-fg shadow-popover',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {title && <p className="mb-2 text-body-m font-semibold text-fg-muted">{title}</p>}
          <div className="flex flex-col gap-2">{children(close)}</div>
        </div>
      )}
    </div>
  )
}

type MenuTone = 'default' | 'muted' | 'warning' | 'danger'

const tones: Record<MenuTone, string> = {
  default: 'text-fg',
  muted: 'text-fg-muted',
  warning: 'text-warning',
  danger: 'text-error',
}

interface MenuItemProps {
  icon?: ReactNode
  tone?: MenuTone
  /** `sm`: 14px text with 22px icons ("Chat actions"). */
  size?: 'md' | 'sm'
  onSelect: () => void
  children: ReactNode
}

export function MenuItem({ icon, tone = 'default', size = 'md', onSelect, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 border-b border-hairline/60 py-2.5 text-left outline-none last:border-b-0',
        size === 'sm' ? 'text-body-s' : 'text-body-m',
        'hover:opacity-80 focus-visible:bg-fg/5',
        tones[tone],
      )}
    >
      {icon && (
        <span
          className={cn(
            'flex shrink-0 items-center justify-center',
            size === 'sm' ? 'size-[22px] [&>svg]:size-[22px]' : 'size-6 [&>svg]:size-6',
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

interface MenuRadioItemProps {
  checked: boolean
  onSelect: () => void
  children: ReactNode
}

export function MenuRadioItem({ checked, onSelect, children }: MenuRadioItemProps) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      onClick={onSelect}
      className="flex w-full items-center gap-2 border-b border-hairline/60 py-2.5 text-left text-body-m text-fg outline-none last:border-b-0 hover:opacity-80 focus-visible:bg-fg/5"
    >
      <RadioMark checked={checked} />
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

/** Material-style radio (Figma "Radio buttons"), orange when selected. */
export function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center">
      <span
        className={cn(
          'flex size-5 items-center justify-center rounded-full border-2',
          checked ? 'border-brand-orange' : 'border-fg-muted',
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-brand-orange" />}
      </span>
    </span>
  )
}
