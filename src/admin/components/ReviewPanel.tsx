import { ChatCenteredText, DotsThree, ShareNetwork, ThumbsUp, X } from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Avatar, AvatarStack, ConfirmDialog, IconButton, Tag, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useModerate } from '../hooks/queries'
import { isGroupContent, type ModerationAction, type Report } from '../types'
import { ReportStatusPill } from './ui'

interface ActionSpec {
  action: ModerationAction
  label: string
  className: string
  /** Irreversible or heavy actions ask first. */
  confirm?: { title: string; message: string }
}

function actionsFor(report: Report): { primary: ActionSpec[]; more: ActionSpec[] } {
  const dismiss: ActionSpec = {
    action: 'dismiss',
    label: 'Dismiss Report',
    className: 'bg-warning-tint text-brand-orange dark:bg-warning/10',
  }
  if (report.content.kind === 'forum' || report.content.kind === 'project') {
    const noun = report.content.kind === 'forum' ? 'Forum' : 'Project'
    return {
      primary: [
        dismiss,
        {
          action: 'warn',
          label: 'Send warning',
          className: 'bg-warning-tint text-warning-strong dark:bg-warning/10 dark:text-warning',
        },
      ],
      more: [
        {
          action: 'suspend-group',
          label: `Suspend ${noun}`,
          className: 'bg-brand-orange text-white',
          confirm: {
            title: `Suspend ${noun.toLowerCase()}?`,
            message: `Members won’t be able to post in “${report.subject}” until it’s reinstated.`,
          },
        },
        {
          action: 'delete-group',
          label: `Delete ${noun}`,
          className: 'bg-error text-white',
          confirm: {
            title: `Delete ${noun.toLowerCase()}?`,
            message: `“${report.subject}” and its content will be permanently removed.`,
          },
        },
      ],
    }
  }
  return {
    primary: [
      dismiss,
      {
        action: 'remove-content',
        label: 'Remove Content',
        className: 'bg-error-tint text-error dark:bg-error/10',
        confirm: { title: 'Remove content?', message: 'The reported content will be hidden from everyone.' },
      },
    ],
    more: [
      { action: 'warn', label: 'Send warning', className: 'bg-warning text-white' },
      {
        action: 'suspend-user',
        label: 'Suspend user',
        className: 'bg-brand-orange-soft text-white',
        confirm: { title: 'Suspend user?', message: `${report.subject} won’t be able to sign in while suspended.` },
      },
      {
        action: 'block-user',
        label: 'Block user',
        className: 'bg-error text-white',
        confirm: { title: 'Block user?', message: `${report.subject} will be blocked from CommUniti.` },
      },
    ],
  }
}

const DONE: Record<ModerationAction, string> = {
  dismiss: 'Report dismissed',
  'remove-content': 'Content removed',
  warn: 'Warning sent',
  'suspend-user': 'User suspended',
  'block-user': 'User blocked',
  'suspend-group': 'Suspended',
  'delete-group': 'Deleted',
}

/**
 * "Review Report" panel (Figma "Sidebars"). Inline beside the queue on wide screens,
 * a slide-over sheet below xl.
 */
export function ReviewPanel({ report, onClose }: { report: Report; onClose: () => void }) {
  const moderate = useModerate()
  const toast = useToast()
  const [confirming, setConfirming] = useState<ActionSpec | null>(null)
  const { primary, more } = actionsFor(report)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && !confirming && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, confirming])

  const run = (spec: ActionSpec) =>
    moderate.mutate(
      { reportId: report.id, action: spec.action },
      {
        onSuccess: () => {
          toast(DONE[spec.action])
          setConfirming(null)
          onClose()
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )

  const button = (spec: ActionSpec) => (
    <button
      key={spec.action}
      type="button"
      disabled={moderate.isPending}
      onClick={() => (spec.confirm ? setConfirming(spec) : run(spec))}
      className={cn(
        'flex h-[38px] w-full items-center justify-center rounded-control px-5 text-body-m font-semibold transition hover:brightness-95 disabled:opacity-60',
        spec.className,
      )}
    >
      {spec.label}
    </button>
  )

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-30 bg-black/40 xl:hidden" aria-hidden />
      <aside
        aria-label={`Review report #${report.number}`}
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-[min(396px,100vw)] flex-col gap-gap-sm overflow-y-auto bg-surface-raised px-5 py-[22px] shadow-popover',
          'xl:sticky xl:top-0 xl:z-auto xl:h-dvh xl:shrink-0 xl:rounded-l-modal xl:shadow-none',
        )}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-body-l font-semibold text-fg">Review Report</h2>
          <IconButton label="Close review" onClick={onClose} className="size-[22px] text-fg">
            <X className="size-[22px]" />
          </IconButton>
        </div>

        <div className="flex flex-col gap-gap-md">
          <div className="flex flex-col gap-gap-sm">
            <div className="flex items-center justify-between">
              <p className="text-body-m font-semibold text-fg">Report #{report.number}</p>
              <ReportStatusPill status={report.status} size="md" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-body-m font-semibold text-fg">Reported content</p>
              <ReportedContentCard report={report} />
            </div>

            <DetailSection title="Report Details" divider="bottom">
              <DetailRow label="Reason" value={report.reason} valueClassName="text-error" />
              <DetailRow label="Reports count" value={report.reportsCount} />
            </DetailSection>
            <DetailSection title="Report History" divider="top">
              <DetailRow label="Previous reports" value={report.previousReports} />
              <DetailRow label="Previous warnings" value={report.previousWarnings} />
              <DetailRow
                label="Account status"
                value={report.accountStatus}
                valueClassName={report.accountStatus === 'Active' ? 'text-success' : 'text-error'}
              />
            </DetailSection>
            <hr className="border-hairline" />
          </div>

          <div className="flex flex-col gap-gap-sm">{primary.map(button)}</div>
          <div className="flex flex-col gap-gap-sm">
            <p className="text-body-m font-semibold text-fg">More Actions:</p>
            <div className="flex flex-col gap-3">{more.map(button)}</div>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirming !== null}
        title={confirming?.confirm?.title ?? ''}
        message={confirming?.confirm?.message ?? ''}
        confirmLabel={confirming?.label ?? ''}
        loading={moderate.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={() => confirming && run(confirming)}
      />
    </>
  )
}

function DetailSection({
  title,
  divider,
  children,
}: {
  title: string
  divider: 'top' | 'bottom'
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className={cn(
          'border-hairline text-body-m font-semibold text-brand-orange-glow',
          divider === 'bottom' ? 'border-b pb-1.5' : 'border-t pt-1.5',
        )}
      >
        {title}
      </p>
      <dl className="flex flex-col gap-gap-sm text-body-m">{children}</dl>
    </div>
  )
}

function DetailRow({ label, value, valueClassName }: { label: string; value: ReactNode; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-fg">{label}</dt>
      <dd className={cn('text-fg-muted', valueClassName)}>{value}</dd>
    </div>
  )
}

function ReportedContentCard({ report }: { report: Report }) {
  const { content } = report
  const card = 'flex flex-col gap-gap-sm rounded-control border border-hairline px-3 py-2.5'

  if (isGroupContent(content)) {
    return (
      <article className={card}>
        <div className="flex flex-col gap-1">
          <p className="text-body-m font-semibold text-fg">{content.title}</p>
          {content.owner && <p className="text-caption text-fg-subtle">By {content.owner}</p>}
          <div className="flex items-center gap-1.5">
            <AvatarStack people={content.members} size={24} />
            <span className="text-caption text-fg-subtle">{content.membersCount} members</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-body-m font-semibold text-fg">Focus:</p>
          <div className="flex flex-wrap gap-2.5">
            {content.focus.map((item) => (
              <Tag key={item.label} tone={item.tone} className="text-xs">
                {item.label}
              </Tag>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 text-fg-muted">
          <p className="text-body-m font-semibold">About:</p>
          <p className="text-caption">{content.about}</p>
        </div>
      </article>
    )
  }

  return (
    <article className={card}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-end gap-[13px]">
          <Avatar src={content.author.avatarUrl} name={content.author.name} size={39} />
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5">
              <span className="text-body-s text-fg">{content.author.name}</span>
              <span className="text-caption text-fg-muted">{timeAgo(content.postedAt)}</span>
            </p>
            <span className="text-caption font-medium text-brand-orange">{content.author.role}</span>
          </div>
        </div>
        <DotsThree aria-hidden weight="bold" className="size-[18px] text-fg" />
      </div>
      <p className="line-clamp-5 text-body-s text-fg">{content.text}</p>
      <div className="flex items-center gap-[11px] text-caption text-fg">
        <span className="flex items-center gap-1.5">
          <ThumbsUp aria-hidden className="size-[18px]" />
          {content.likes}
          <span className="sr-only">likes</span>
        </span>
        <span className="flex items-center gap-1.5">
          <ChatCenteredText aria-hidden className="size-[18px]" />
          {content.comments}
          <span className="sr-only">comments</span>
        </span>
        <ShareNetwork aria-hidden className="size-[18px]" />
      </div>
    </article>
  )
}
