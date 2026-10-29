import { At, Info, SignIn, SignOut, type Icon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui'
import type { AdminGetUserResponse, VerificationDetails } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { timeAgo, titleCase } from '@/lib/format'
import { useAdminUser, useUserLogs } from '../hooks/queries'
import { adminPaths } from '../paths'
import { DetailRow, DetailSection, PanelLoading, SidePanel } from './SidePanel'
import { ErrorState } from './states'

/** Role-form answers worth showing, in form order (file ids are left out). */
const DETAIL_LABELS: Partial<Record<keyof VerificationDetails, string>> = {
  institutionalEmail: 'Institutional email',
  orcidId: 'ORCID iD',
  researchProjectLink: 'Research link',
  researchEvidence: 'Evidence of research',
  ventureName: 'Project / venture',
  description: 'Description',
  developmentStage: 'Stage of development',
  evidenceLink: 'Evidence of work',
  organizationName: 'Organization',
  professionalTitle: 'Professional title',
  profileLink: 'Profile link',
  workEmail: 'Work email',
  studentEmail: 'Student email',
  institution: 'School / institution',
  courseOfStudy: 'Course of study',
  level: 'Level / year',
}

/** "User details" panel opened from the Users table (Figma "User details"). */
export function UserDetailsPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const user = useAdminUser(userId)

  return (
    <SidePanel title="User details" label="User details" onClose={onClose}>
      {user.isPending ? (
        <PanelLoading />
      ) : user.isError ? (
        <ErrorState message={getErrorMessage(user.error)} onRetry={() => user.refetch()} />
      ) : (
        <UserDetails user={user.data} />
      )}
    </SidePanel>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[10px] text-fg-muted">{label}</dt>
      <dd className={className ?? 'text-body-m break-words text-fg'}>{value}</dd>
    </div>
  )
}

function UserDetails({ user }: { user: AdminGetUserResponse }) {
  const details = user.verification?.details ?? {}
  const answers = (Object.keys(DETAIL_LABELS) as (keyof VerificationDetails)[])
    .map((key) => ({ key, label: DETAIL_LABELS[key]!, value: details[key] }))
    .filter(
      (item): item is { key: keyof VerificationDetails; label: string; value: string } =>
        typeof item.value === 'string' && item.value !== '',
    )
  // Older accounts filled these on the profile instead of a role form.
  const legacy = answers.length
    ? []
    : [
        { key: 'institutionalEmail', label: 'Institutional email', value: user.institutionalEmail },
        { key: 'researchLink', label: 'Research link', value: user.researchLink },
        { key: 'researchEvidence', label: 'Evidence of research', value: user.researchEvidence },
      ].filter((item): item is { key: string; label: string; value: string } => Boolean(item.value))
  const status = user.reportHistory.accountStatus

  return (
    <div className="flex flex-col gap-gap-md">
      <div className="flex flex-col gap-3">
        <p className="text-body-m font-semibold text-fg" title={user.id}>
          {user.shortId}
        </p>
        <Avatar src={user.avatarUrl ?? undefined} name={user.fullName} size={40} />
        <dl className="flex flex-col gap-3">
          <Field label="Fullname" value={user.fullName} />
          {user.location && <Field label="Location" value={user.location} />}
          {user.memberRole && (
            <Field
              label="Role"
              value={`${titleCase(user.memberRole)}${user.verified ? ' · Verified' : ''}`}
              className="text-body-m text-brand-orange"
            />
          )}
          <Field label="Email" value={user.email} />
          {[...answers, ...legacy].map((item) => (
            <Field
              key={item.key}
              label={item.label}
              value={item.key === 'developmentStage' ? titleCase(item.value) : item.value}
            />
          ))}
        </dl>
      </div>

      <DetailSection title="Report History" divider="top">
        <DetailRow label="Previous reports" value={user.reportHistory.previousReports} />
        <DetailRow label="Previous warnings" value={user.reportHistory.previousWarnings} />
        <DetailRow
          label="Account status"
          value={titleCase(status)}
          valueClassName={status === 'active' ? 'text-success' : 'text-error'}
        />
      </DetailSection>

      <RecentLogs userId={user.id} />
    </div>
  )
}

const LOG_ICONS: [string, Icon][] = [
  ['email', At],
  ['logout', SignOut],
  ['login', SignIn],
]
const logIcon = (action: string) => LOG_ICONS.find(([key]) => action.includes(key))?.[1] ?? Info

function RecentLogs({ userId }: { userId: string }) {
  const logs = useUserLogs(userId, { pageSize: 3 })
  return (
    <DetailSection
      title="Account logs"
      divider="top"
      action={
        <Link to={adminPaths.userLogs(userId)} className="text-caption font-semibold text-fg underline">
          View all
        </Link>
      }
    >
      {logs.isPending ? (
        <PanelLoading />
      ) : !logs.data?.data.length ? (
        <p className="text-body-s text-fg-muted">No account activity yet.</p>
      ) : (
        logs.data.data.map((entry) => {
          const LogIcon = logIcon(entry.action)
          return (
            <div key={entry.id} className="flex flex-col gap-1 border-b border-hairline pb-2.5 last:border-b-0">
              <div className="flex items-center justify-between gap-2 text-[10px] text-fg-muted">
                <dt className="flex items-center gap-1">
                  <LogIcon aria-hidden className="size-3" />
                  {entry.label}
                </dt>
                <time dateTime={entry.createdAt}>{timeAgo(entry.createdAt)}</time>
              </div>
              <dd className="text-body-s text-fg">{entry.details}</dd>
            </div>
          )
        })
      )}
    </DetailSection>
  )
}
