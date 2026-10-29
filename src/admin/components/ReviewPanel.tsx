import { ChatCenteredText, ShareNetwork, ThumbsUp } from '@phosphor-icons/react'
import { useState } from 'react'
import { Avatar, AvatarStack, ConfirmDialog, Tag, type TagTone, useToast } from '@/components/ui'
import type { AdminReport, AdminReportDetail, AdminResolveReportBody, ReportedContent } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { timeAgo, titleCase } from '@/lib/format'
import { useReport, useResolveReport } from '../hooks/queries'
import { reasonLabel, reportPill, reportSubject } from '../reports'
import { DetailRow, DetailSection, PanelLoading, SidePanel } from './SidePanel'
import { ReportStatusPill } from './ui'
import { ErrorState } from './states'

interface ActionSpec {
  key: string
  label: string
  className: string
  body: AdminResolveReportBody
  done: string
  /** Heavier actions ask first, with a reason box (Figma "action model"). */
  confirm?: { title: string; message: string; label: string }
}

const isGroup = (type: AdminReport['targetType']) => type === 'forum' || type === 'project'

function actionsFor(report: AdminReport): { primary: ActionSpec[]; more: ActionSpec[] } {
  const name = reportSubject(report)
  const dismiss: ActionSpec = {
    key: 'dismiss',
    label: 'Dismiss Report',
    className: 'bg-warning-tint text-brand-orange dark:bg-warning/10',
    body: { action: 'dismiss' },
    done: 'Report dismissed',
  }

  if (isGroup(report.targetType)) {
    const noun = report.targetType === 'forum' ? 'Forum' : 'Project'
    return {
      primary: [
        dismiss,
        {
          key: 'warn',
          label: 'Send warning',
          className: 'bg-warning-tint text-warning-strong dark:bg-warning/10 dark:text-warning',
          body: { action: 'warn' },
          done: 'Warning sent',
          confirm: {
            title: `Warn ${name}?`,
            message: `The ${noun.toLowerCase()} owner is told why. Repeated warnings can lead to suspension.`,
            label: 'Send warning',
          },
        },
      ],
      more: [
        {
          key: 'suspend',
          label: `Suspend ${noun}`,
          className: 'bg-brand-orange text-white',
          body: { action: 'suspend' },
          done: `${noun} suspended`,
          confirm: {
            title: `Suspend ${name}?`,
            message: `Members won’t be able to use this ${noun.toLowerCase()} until an admin reinstates it.`,
            label: `Suspend ${noun}`,
          },
        },
        {
          key: 'delete',
          label: `Delete ${noun}`,
          className: 'bg-error text-white',
          body: { action: 'remove_content' },
          done: `${noun} deleted`,
          confirm: {
            title: `Delete ${name}?`,
            message: `Members will no longer see this ${noun.toLowerCase()} or its content.`,
            label: `Delete ${noun}`,
          },
        },
      ],
    }
  }

  const person = report.targetUser?.fullName ?? 'this user'
  return {
    primary: [
      dismiss,
      // A report about a person has no single piece of content to remove.
      ...(report.targetType === 'user'
        ? []
        : [
            {
              key: 'remove',
              label: 'Remove Content',
              className: 'bg-error-tint text-error dark:bg-error/10',
              body: { action: 'remove_content' },
              done: 'Content removed',
              confirm: {
                title: 'Remove this content?',
                message: 'The reported content will be hidden from everyone.',
                label: 'Remove Content',
              },
            } satisfies ActionSpec,
          ]),
    ],
    more: [
      {
        key: 'warn',
        label: 'Send warning',
        className: 'bg-warning text-white',
        body: { action: 'warn' },
        done: 'Warning sent',
        confirm: {
          title: `Warn ${person}?`,
          message: `${person} is told why. Repeated warnings can lead to suspension.`,
          label: 'Send warning',
        },
      },
      {
        key: 'suspend',
        label: 'Suspend user',
        className: 'bg-brand-orange-soft text-white',
        body: { action: 'suspend' },
        done: 'User suspended',
        confirm: {
          title: `Suspend ${person}?`,
          message: `${person} won’t be able to sign in until an admin reinstates them.`,
          label: 'Suspend User',
        },
      },
      {
        key: 'block',
        label: 'Block user',
        className: 'bg-error text-white',
        body: { action: 'block' },
        done: 'User blocked',
        confirm: {
          title: `Block ${person}?`,
          message:
            'Are you sure you want to block this user? Blocking this account will restrict the user from accessing Communiti',
          label: 'Block User',
        },
      },
    ],
  }
}

/** "Review Report" panel (Figma "moderation view side bar"). */
export function ReviewPanel({ report, onClose }: { report: AdminReport; onClose: () => void }) {
  const detail = useReport(report.id)
  const resolve = useResolveReport()
  const toast = useToast()
  const [confirming, setConfirming] = useState<ActionSpec | null>(null)
  const { primary, more } = actionsFor(report)
  // Only pending reports can be acted on.
  const open = report.status === 'pending'

  const run = (spec: ActionSpec, reason = '') =>
    resolve.mutate(
      { id: report.id, data: { ...spec.body, ...(reason && { note: reason }) } },
      {
        onSuccess: () => {
          toast(spec.done)
          setConfirming(null)
          onClose()
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )

  const button = (spec: ActionSpec) => (
    <button
      key={spec.key}
      type="button"
      disabled={resolve.isPending}
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
    <SidePanel
      title="Review Report"
      label={`Review report #${report.number}`}
      onClose={onClose}
      lockEscape={confirming !== null}
    >
      <div className="flex flex-col gap-gap-md">
        <div className="flex flex-col gap-gap-sm">
          <div className="flex items-center justify-between">
            <p className="text-body-m font-semibold text-fg">Report #{report.number}</p>
            <ReportStatusPill status={reportPill(report)} size="md" />
          </div>

          {detail.isPending ? (
            <PanelLoading />
          ) : detail.isError ? (
            <ErrorState message={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} />
          ) : (
            <ReportBody report={detail.data} />
          )}
          <hr className="border-hairline" />
        </div>

        {open ? (
          <>
            <div className="flex flex-col gap-gap-sm">{primary.map(button)}</div>
            <div className="flex flex-col gap-gap-sm">
              <p className="text-body-m font-semibold text-fg">More Actions:</p>
              <div className="flex flex-col gap-3">{more.map(button)}</div>
            </div>
          </>
        ) : (
          <p className="text-body-s text-fg-muted">
            {report.resolution ?? `This report was ${report.status === 'dismissed' ? 'dismissed' : 'reviewed'}.`}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirming !== null}
        withReason
        title={confirming?.confirm?.title ?? ''}
        message={confirming?.confirm?.message ?? ''}
        confirmLabel={confirming?.confirm?.label ?? ''}
        loading={resolve.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={(reason) => confirming && run(confirming, reason)}
      />
    </SidePanel>
  )
}

function ReportBody({ report }: { report: AdminReportDetail }) {
  const status = report.history.accountStatus
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-body-m font-semibold text-fg">Reported content</p>
        <ReportedContentCard content={report.content} />
      </div>
      <DetailSection title="Report Details" divider="bottom">
        <DetailRow label="Reason" value={reasonLabel(report.reason)} valueClassName="text-error" />
        <DetailRow label="Reports count" value={report.reportsCount} />
      </DetailSection>
      <DetailSection title="Report History" divider="top">
        <DetailRow label="Previous reports" value={report.history.previousReports} />
        <DetailRow label="Previous warnings" value={report.history.previousWarnings} />
        <DetailRow
          label={isGroup(report.targetType) ? 'Status' : 'Account status'}
          value={titleCase(status)}
          valueClassName={status === 'active' ? 'text-success' : 'text-error'}
        />
      </DetailSection>
    </>
  )
}

const FOCUS_TONES: TagTone[] = ['success', 'info', 'warning']

function ReportedContentCard({ content }: { content: ReportedContent }) {
  const card = 'flex flex-col gap-gap-sm rounded-control border border-hairline px-3 py-2.5'

  if (content.type === 'forum' || content.type === 'project') {
    return (
      <article className={card}>
        <div className="flex flex-col gap-1">
          <p className="text-body-m font-semibold text-fg">{content.title}</p>
          {content.type === 'project' && content.author && (
            <p className="text-caption text-fg-subtle">By {content.author.fullName}</p>
          )}
          <div className="flex items-center gap-1.5">
            <AvatarStack
              people={content.members.map((member) => ({
                id: member.id,
                name: member.fullName,
                avatarUrl: member.avatarUrl ?? undefined,
              }))}
              size={24}
            />
            <span className="text-caption text-fg-subtle">{content.memberCount ?? 0} members</span>
          </div>
        </div>
        {content.topics.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-body-m font-semibold text-fg">Focus:</p>
            <div className="flex flex-wrap gap-2.5">
              {content.topics.map((topic, index) => (
                <Tag key={topic.id} tone={FOCUS_TONES[index % FOCUS_TONES.length]} className="text-xs">
                  {topic.name}
                </Tag>
              ))}
            </div>
          </div>
        )}
        {content.body && (
          <div className="flex flex-col gap-2.5 text-fg-muted">
            <p className="text-body-m font-semibold">About:</p>
            <p className="text-caption">{content.body}</p>
          </div>
        )}
      </article>
    )
  }

  const author = content.author
  return (
    <article className={card}>
      {author && (
        <div className="flex items-end gap-[13px]">
          <Avatar src={author.avatarUrl ?? undefined} name={author.fullName} size={39} />
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5">
              <span className="text-body-s text-fg">{author.fullName}</span>
              {content.createdAt && <span className="text-caption text-fg-muted">{timeAgo(content.createdAt)}</span>}
            </p>
            {author.memberRole && (
              <span className="text-caption font-medium text-brand-orange">{titleCase(author.memberRole)}</span>
            )}
          </div>
        </div>
      )}
      {content.body && <p className="line-clamp-5 text-body-s text-fg">{content.body}</p>}
      {content.removed && <p className="text-caption text-error">Already removed</p>}
      {content.likeCount !== null && (
        <div className="flex items-center gap-[11px] text-caption text-fg">
          <span className="flex items-center gap-1.5">
            <ThumbsUp aria-hidden className="size-[18px]" />
            {content.likeCount}
            <span className="sr-only">likes</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ChatCenteredText aria-hidden className="size-[18px]" />
            {content.commentCount ?? 0}
            <span className="sr-only">comments</span>
          </span>
          <ShareNetwork aria-hidden className="size-[18px]" />
        </div>
      )}
    </article>
  )
}
