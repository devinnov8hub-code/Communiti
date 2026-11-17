import {
  ArrowClockwise,
  ArrowsClockwise,
  CloudWarning,
  Hourglass,
  LockSimple,
  MagnifyingGlass,
  SignIn,
  WarningCircle,
  WifiSlash,
  type Icon,
} from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { describeError, type ErrorKind } from '@/lib/errorDisplay'
import { Button } from './Button'

const ICONS: Record<ErrorKind, Icon> = {
  offline: WifiSlash,
  notFound: MagnifyingGlass,
  forbidden: LockSimple,
  session: SignIn,
  busy: Hourglass,
  server: CloudWarning,
  update: ArrowsClockwise,
  unknown: WarningCircle,
}

// Failures on our side read as errors (red); the rest are situations, in the brand orange.
const ALARMING: ErrorKind[] = ['server', 'unknown']

// These titles say more than any screen-specific one ("Couldn’t load your chats").
const KIND_TITLE_WINS: ErrorKind[] = ['offline', 'session', 'update']

export interface ErrorStateProps {
  /** The thrown value: picks the icon and friendly wording. */
  error?: unknown
  /** What failed, e.g. "Event not found" or "Couldn’t load your chats". */
  title?: string
  /** Overrides the derived explanation. */
  message?: string
  onRetry?: () => void
  /** Shows the retry button as busy (e.g. a query's `isFetching`). */
  retrying?: boolean
  /** Extra buttons, e.g. "Go back". */
  actions?: ReactNode
  /** `section` is the compact version for tabs, panels and side columns. */
  size?: 'page' | 'section'
  className?: string
  children?: ReactNode
}

/** Shared "this couldn’t load" screen: icon, plain-language title and message, and a way out. */
export function ErrorState({
  error,
  title,
  message,
  onRetry,
  retrying,
  actions,
  size = 'page',
  className,
  children,
}: ErrorStateProps) {
  const described = describeError(error)
  const Glyph = ICONS[described.kind]
  const heading = KIND_TITLE_WINS.includes(described.kind) ? described.title : (title ?? described.title)
  const compact = size === 'section'

  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex w-full max-w-md flex-col items-center text-center',
        compact ? 'gap-3 px-4 py-8' : 'gap-4 px-5 py-16',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full',
          compact ? 'size-12' : 'size-16',
          ALARMING.includes(described.kind)
            ? 'bg-error-tint text-error dark:bg-error/15'
            : 'bg-brand-orange-tint text-brand-orange dark:bg-brand-orange/15',
        )}
      >
        <Glyph weight="duotone" className={compact ? 'size-6' : 'size-8'} />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className={cn('font-semibold text-fg', compact ? 'text-body-m' : 'text-body-l')}>{heading}</p>
        <p className="text-body-s text-fg-muted">{message ?? described.message}</p>
      </div>
      {(onRetry || actions) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {onRetry && (
            <Button
              fullWidth={false}
              loading={retrying}
              onClick={onRetry}
              className="h-10 rounded-full bg-brand-orange px-5 text-body-m"
            >
              <ArrowClockwise aria-hidden weight="bold" className="size-4" />
              Try again
            </Button>
          )}
          {actions}
        </div>
      )}
      {described.reference && (
        <p className="text-caption text-fg-subtle select-all">Reference: {described.reference}</p>
      )}
      {children}
    </div>
  )
}
