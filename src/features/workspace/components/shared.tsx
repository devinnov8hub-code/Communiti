import { PaperPlaneRight } from '@phosphor-icons/react'
import { forwardRef, useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { ActionButton, Avatar, Spinner } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getDisplayName } from '@/features/auth/user'
import { cn } from '@/lib/cn'

/** Orange "+ New Document" / "+ New Prototype" button above a tab's content. */
export function WorkspaceAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <ActionButton onClick={onClick} className="self-end">
      {children}
    </ActionButton>
  )
}

interface ModalActionsProps {
  confirmLabel: string
  onCancel: () => void
  /** Submit button of the surrounding form when omitted. */
  onConfirm?: () => void
  loading?: boolean
  disabled?: boolean
}

/** Text-only "Cancel · Create" row used by the workspace sheets. */
export function ModalActions({ confirmLabel, onCancel, onConfirm, loading, disabled }: ModalActionsProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <button type="button" onClick={onCancel} className="text-body-m text-grey-40 hover:text-fg">
        Cancel
      </button>
      <button
        type={onConfirm ? 'button' : 'submit'}
        onClick={onConfirm}
        disabled={disabled || loading}
        className="flex items-center gap-2 text-body-m text-brand-orange hover:brightness-90 disabled:opacity-50"
      >
        {loading && <Spinner />}
        {confirmLabel}
      </button>
    </div>
  )
}

interface FilledFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

/** Material "filled" text field (orange tint + underline) from the New Prototype / Upload version sheets. */
export const FilledField = forwardRef<HTMLInputElement, FilledFieldProps>(function FilledField(
  { label, error, id, className, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        className={cn(
          'flex flex-col gap-2 rounded-t-sm border-b-2 bg-brand-orange-tint px-2 pt-2 pb-2.5 transition-colors dark:bg-brand-orange/10',
          error ? 'border-red-500' : 'border-brand-orange-soft focus-within:border-brand-orange',
        )}
      >
        <label htmlFor={inputId} className="text-caption text-grey-40 dark:text-fg-body">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className="bg-transparent text-body-m text-fg outline-none placeholder:text-fg"
          {...props}
        />
      </div>
      {error && (
        <p role="alert" className="text-body-s text-red-500">
          {error}
        </p>
      )}
    </div>
  )
})

/** "Write a comment..." pill under research documents and prototype versions. */
export function CommentBar({ onSubmit, pending }: { onSubmit: (text: string) => Promise<unknown>; pending: boolean }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const name = user ? getDisplayName(user) : 'You'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const value = text.trim()
    if (!value) return
    await onSubmit(value)
    setText('')
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1 rounded-full bg-input-fill px-2 py-[5px]">
      <Avatar src={user?.avatarUrl} name={name} size={28} />
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write a comment..."
        aria-label="Write a comment"
        className="min-w-0 flex-1 bg-transparent px-2 py-[5px] text-body-s text-fg outline-none placeholder:text-fg-muted"
      />
      {text.trim() && (
        <button
          type="submit"
          disabled={pending}
          aria-label="Send comment"
          className="flex size-7 items-center justify-center rounded-full text-brand-orange hover:bg-fg/5 disabled:opacity-50"
        >
          {pending ? <Spinner /> : <PaperPlaneRight weight="fill" className="size-5" />}
        </button>
      )}
    </form>
  )
}

/** Loading / error / empty placeholder used by every tab. */
export function TabState({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-center gap-3 py-16 text-center text-body-m text-fg-muted">{children}</div>
}
