import { X } from '@phosphor-icons/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Space between the title row and content: 14px (`sm`) or 24px (`md`, default). */
  gap?: 'sm' | 'md'
  /** Draw a divider under the title (Figma "Edit profile" sheets). */
  divided?: boolean
  /** Sticky action bar under a scrollable body (Figma "Bottom bar"). */
  footer?: ReactNode
  className?: string
}

/**
 * Centred dialog built on the native <dialog> element — focus trapping,
 * Escape-to-close and the backdrop come from the browser.
 */
export function Modal({ open, onClose, title, children, gap = 'md', divided, footer, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // Clicking the backdrop (the dialog element itself) closes it.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className={cn(
        'm-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[676px] overflow-hidden rounded-modal bg-popover p-0 text-fg',
        'backdrop:bg-black/50 open:flex open:flex-col',
        className,
      )}
    >
      {open && (
        <>
          <div className="shrink-0 px-5 pt-2.5 sm:px-6 sm:pt-3.5">
            <div
              className={cn(
                'flex items-center justify-between gap-4',
                divided && 'border-b border-hairline px-0 py-2.5 sm:px-5',
              )}
            >
              <h2 id={titleId} className={cn('font-semibold', divided ? 'text-h4' : 'text-h3')}>
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-m-2 rounded-full p-2 text-fg hover:bg-fg/5"
              >
                <X className={divided ? 'size-6' : 'size-[18px]'} />
              </button>
            </div>
          </div>
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5 sm:px-6',
              gap === 'sm' ? 'gap-gap-sm pt-3.5' : 'gap-gap-md pt-6',
            )}
          >
            {children}
          </div>
          {footer && <div className="shrink-0 border-t border-hairline px-[30px] py-2">{footer}</div>}
        </>
      )}
    </dialog>
  )
}
