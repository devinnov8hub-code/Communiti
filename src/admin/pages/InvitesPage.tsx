import { CheckCircle, EnvelopeSimple, Hourglass, UserGear } from '@phosphor-icons/react'
import { useDeferredValue, useState } from 'react'
import { useToast } from '@/components/ui'
import { getRoleLabel } from '@/features/auth/user'
import type { AdminInvite, AdminInviteStats } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { AdminTopBar } from '../components/AdminTopBar'
import { UserDetailsPanel } from '../components/UserDetailsPanel'
import { ErrorState, StatSkeleton } from '../components/states'
import {
  AdminContent,
  DataTable,
  Pagination,
  Panel,
  PanelHeader,
  StatGrid,
  TableSearch,
  type Column,
} from '../components/ui'
import { useInviteStats, useInvites, useResendInvite } from '../hooks/queries'
import type { StatCardData } from '../types'

const PAGE_SIZE = 15

type Stage = AdminInvite['stage']

/** Onboarding stages in the order people move through them. */
const STAGES: { value: Stage; label: string; hint: string; className: string }[] = [
  {
    value: 'invited',
    label: 'Invited',
    hint: 'Email sent; they haven’t opened the link and set up their account yet.',
    className: 'bg-info-tint text-info-strong',
  },
  {
    value: 'link_expired',
    label: 'Link expired',
    hint: 'The 7-day link ran out before they set up their account. Resend a new one.',
    className: 'bg-error-tint text-error dark:bg-error/15',
  },
  {
    value: 'account_set_up',
    label: 'Account set up',
    hint: 'Password chosen or Google linked; they haven’t chosen a role yet.',
    className: 'bg-brand-orange-tint text-warning dark:bg-warning/15',
  },
  {
    value: 'role_submitted',
    label: 'Role submitted',
    hint: 'Role and verification details sent; interests not chosen yet.',
    className: 'bg-stat-violet-tint text-stat-violet',
  },
  {
    value: 'onboarded',
    label: 'Onboarded',
    hint: 'Finished onboarding and can use CommUniti.',
    className: 'bg-brand-green-tint text-success dark:bg-success/15 dark:text-brand-green',
  },
]
const stageOf = (stage: Stage) => STAGES.find((item) => item.value === stage)!

const VERIFICATION: Record<AdminInvite['verificationStatus'], string> = {
  unverified: 'Not verified',
  pending: 'Awaiting review',
  verified: 'Verified',
  rejected: 'Rejected',
}

const day = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))

function statCards(stats: AdminInviteStats): StatCardData[] {
  return [
    { id: 'total', label: 'Invited', caption: 'Everyone invited', value: stats.total, tone: 'indigo' },
    {
      id: 'waiting',
      label: 'Not set up yet',
      caption: `${stats.link_expired} with an expired link`,
      value: stats.invited + stats.link_expired,
      tone: 'orange',
    },
    {
      id: 'progress',
      label: 'Onboarding',
      caption: 'Set up, not finished',
      value: stats.account_set_up + stats.role_submitted,
      tone: 'violet',
    },
    { id: 'done', label: 'Onboarded', caption: 'Finished onboarding', value: stats.onboarded, tone: 'green' },
  ]
}

const STAT_ICONS = { total: EnvelopeSimple, waiting: Hourglass, progress: UserGear, done: CheckCircle }

/** Pilot invitations: who was invited and how far each person got with onboarding. */
export function InvitesPage() {
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState<Stage | undefined>()
  const [page, setPage] = useState(1)
  const [openUserId, setOpenUserId] = useState<string | null>(null)
  const query = useDeferredValue(search.trim())
  const stats = useInviteStats()
  const invites = useInvites({ page, pageSize: PAGE_SIZE, stage, q: query || undefined })

  const onSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const onStage = (value: Stage | undefined) => {
    setStage(value)
    setPage(1)
  }

  const columns: Column<AdminInvite>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (invite) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setOpenUserId(invite.userId)
          }}
          className="max-w-[200px] truncate text-left hover:underline"
        >
          {invite.fullName}
        </button>
      ),
    },
    { key: 'email', header: 'Email', cell: (invite) => invite.email },
    { key: 'stage', header: 'Stage', cell: (invite) => <StageBadge stage={invite.stage} /> },
    {
      key: 'role',
      header: 'Role',
      cell: (invite) =>
        invite.memberRole ? (
          <span className="whitespace-nowrap">
            {getRoleLabel({ role: invite.memberRole })}
            <span className="text-fg-muted"> · {VERIFICATION[invite.verificationStatus]}</span>
          </span>
        ) : (
          <span className="text-fg-muted">—</span>
        ),
    },
    {
      key: 'invited',
      header: 'Invited',
      cell: (invite) => (
        <span
          className="whitespace-nowrap"
          title={`${invite.linksSent} link(s) sent, latest ${day(invite.lastSentAt)}`}
        >
          {day(invite.invitedAt)}
          {invite.linksSent > 1 && <span className="text-fg-muted"> · {invite.linksSent} links</span>}
        </span>
      ),
    },
    {
      key: 'activity',
      header: 'Last sign-in',
      cell: (invite) =>
        invite.lastSignInAt ? (
          <span className="whitespace-nowrap">
            {day(invite.lastSignInAt)}
            {invite.signedInWith === 'google' && <span className="text-fg-muted"> · Google</span>}
          </span>
        ) : invite.status === 'pending' ? (
          <span className="whitespace-nowrap text-fg-muted">Link valid until {day(invite.expiresAt)}</span>
        ) : (
          <span className="text-fg-muted">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      cell: (invite) => (
        <span onClick={(event) => event.stopPropagation()}>
          {invite.status === 'accepted' ? <span className="text-fg-muted">—</span> : <ResendButton invite={invite} />}
        </span>
      ),
    },
  ]

  return (
    <div className="flex">
      <div className="min-w-0 flex-1">
        <AdminTopBar title="Invitations" searchPlaceholder="Search invitations" search={search} onSearch={onSearch} />
        <AdminContent>
          {stats.isError ? (
            <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
          ) : stats.data ? (
            <StatGrid stats={statCards(stats.data)} icons={STAT_ICONS} />
          ) : (
            <StatSkeleton />
          )}

          <Panel className="py-[3px]">
            <PanelHeader
              title="Invited people"
              className="border-b border-hairline [&_h2]:text-body-m"
              action={<TableSearch value={search} onChange={onSearch} placeholder="Search by name or email" />}
            />
            <StageFilter value={stage} onChange={onStage} stats={stats.data} />
            {invites.isError ? (
              <ErrorState error={invites.error} onRetry={() => invites.refetch()} />
            ) : (
              <>
                <DataTable
                  columns={columns}
                  rows={invites.data?.data}
                  rowKey={(invite) => invite.userId}
                  onRowClick={(invite) => setOpenUserId(invite.userId)}
                  selectedKey={openUserId ?? undefined}
                  loading={invites.isFetching}
                  headerTint={false}
                  empty={
                    query || stage
                      ? 'Nobody matches this filter.'
                      : 'No invitations yet. Invite people from the server with npm run invite.'
                  }
                />
                {invites.data && (
                  <Pagination
                    page={invites.data.page}
                    pageSize={invites.data.pageSize}
                    total={invites.data.total}
                    shown={invites.data.data.length}
                    onPage={setPage}
                  />
                )}
              </>
            )}
          </Panel>
        </AdminContent>
      </div>
      {openUserId && <UserDetailsPanel userId={openUserId} onClose={() => setOpenUserId(null)} />}
    </div>
  )
}

function StageBadge({ stage }: { stage: Stage }) {
  const { label, hint, className } = stageOf(stage)
  return (
    <span
      title={hint}
      className={cn(
        'inline-flex h-7 items-center rounded-full px-2.5 text-body-s font-semibold whitespace-nowrap',
        className,
      )}
    >
      {label}
    </span>
  )
}

/** "All · Invited · Link expired · …" chips with the count at each stage. */
function StageFilter({
  value,
  onChange,
  stats,
}: {
  value: Stage | undefined
  onChange: (value: Stage | undefined) => void
  stats: AdminInviteStats | undefined
}) {
  const chips: { value: Stage | undefined; label: string; count?: number; hint?: string }[] = [
    { value: undefined, label: 'All', count: stats?.total },
    ...STAGES.map((item) => ({ value: item.value, label: item.label, count: stats?.[item.value], hint: item.hint })),
  ]
  return (
    <div
      role="group"
      aria-label="Filter by stage"
      className="flex flex-wrap gap-2 border-b border-hairline px-2.5 py-2.5"
    >
      {chips.map((chip) => {
        const active = chip.value === value
        return (
          <button
            key={chip.label}
            type="button"
            title={chip.hint}
            aria-pressed={active}
            onClick={() => onChange(chip.value)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-full border px-3 text-body-s transition-colors',
              active
                ? 'border-brand-orange bg-brand-orange-tint text-brand-orange dark:bg-brand-orange/15'
                : 'border-hairline text-fg-muted hover:text-fg',
            )}
          >
            {chip.label}
            {chip.count !== undefined && <span className="font-semibold">{chip.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Text button (no background): emails a fresh 7-day link straight away. Admins only; moderators get an error toast. */
function ResendButton({ invite }: { invite: AdminInvite }) {
  const resend = useResendInvite()
  const toast = useToast()
  return (
    <button
      type="button"
      disabled={resend.isPending}
      onClick={() =>
        resend.mutate(invite.email, {
          onSuccess: () => toast(`New link sent to ${invite.email}`),
          onError: (error) => toast(getErrorMessage(error)),
        })
      }
      className="text-body-s font-semibold whitespace-nowrap text-brand-orange hover:underline disabled:opacity-50"
    >
      {resend.isPending ? 'Sending…' : 'Resend link'}
    </button>
  )
}
