import { DotsThree } from '@phosphor-icons/react'
import { useDeferredValue, useState } from 'react'
import { Avatar, ConfirmDialog, IconButton, Menu, MenuItem, useToast } from '@/components/ui'
import type { AdminGetUserStatsResponse, AdminSetUserStatusBody, AdminUser } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { ActivityChart } from '../components/charts'
import { PendingReportsTable } from '../components/ReportTables'
import { USER_STAT_ICONS } from '../components/statIcons'
import { UserDetailsPanel } from '../components/UserDetailsPanel'
import { ErrorState, StatSkeleton } from '../components/states'
import {
  AdminContent,
  DataTable,
  DateRangeSelect,
  Pagination,
  Panel,
  PanelHeader,
  PanelLink,
  RecordStatusBadge,
  StatGrid,
  TableSearch,
  type Column,
} from '../components/ui'
import { useAdminUsers, useSetUserStatus, useUsersDashboard } from '../hooks/queries'
import { adminPaths } from '../paths'
import { activityBars, kpiCard, rangeLabel } from '../stats'
import type { DateRange, StatCardData } from '../types'

const PAGE_SIZE = 10

const stamp = (iso: string) => iso.replace('T', ' ').slice(0, 19)
/** Total / Active / New / Blocked cards ("USERS"). */
function statCards(stats: AdminGetUserStatsResponse, range: DateRange): StatCardData[] {
  const caption = rangeLabel(range)
  return [
    kpiCard('total', 'Total', caption, stats.total, 'indigo'),
    kpiCard('active', 'Active', caption, stats.active, 'green'),
    kpiCard('new', 'New', caption, stats.new, 'orange'),
    kpiCard('blocked', 'Blocked', caption, stats.blocked, 'red'),
  ]
}

/** Users dashboard (Figma "USERS"), on real backend data. */
export function UsersPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [openUserId, setOpenUserId] = useState<string | null>(null)
  const query = useDeferredValue(search.trim())
  const dashboard = useUsersDashboard(range)

  // The top-bar search and the table search are the same search.
  const onSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="flex">
      <div className="min-w-0 flex-1">
        <AdminTopBar title="Users" searchPlaceholder="Search users" search={search} onSearch={onSearch} />
        <AdminContent>
          <DateRangeSelect value={range} onChange={setRange} />
          {dashboard.isError ? (
            <ErrorState message={getErrorMessage(dashboard.error)} onRetry={() => dashboard.refetch()} />
          ) : (
            <>
              {dashboard.data ? (
                <StatGrid stats={statCards(dashboard.data.stats, range)} icons={USER_STAT_ICONS} />
              ) : (
                <StatSkeleton />
              )}
              <div className="grid gap-gap-lg xl:grid-cols-2">
                <ActivityChart
                  title="User Activity"
                  legend={range === '12m' ? 'Sign-ups per month' : 'Sign-ups per day'}
                  points={dashboard.data ? activityBars(dashboard.data.activity, 'signups') : []}
                />
                <Panel className="px-1.5 pt-[15px] pb-1">
                  <PanelHeader
                    title="Moderation Queue"
                    action={<PanelLink to={adminPaths.moderation('users')}>View All</PanelLink>}
                  />
                  <PendingReportsTable
                    reports={dashboard.data?.reports}
                    loading={dashboard.isPending}
                    nameHeader="Username"
                    showType={false}
                  />
                </Panel>
              </div>
            </>
          )}
          <UsersTable
            search={search}
            query={query}
            onSearch={onSearch}
            page={page}
            onPage={setPage}
            openUserId={openUserId}
            onOpenUser={setOpenUserId}
          />
        </AdminContent>
      </div>
      {openUserId && <UserDetailsPanel userId={openUserId} onClose={() => setOpenUserId(null)} />}
    </div>
  )
}

/* ---------------------------------- Table --------------------------------- */

function UsersTable({
  search,
  query,
  onSearch,
  page,
  onPage,
  openUserId,
  onOpenUser,
}: {
  search: string
  query: string
  onSearch: (value: string) => void
  page: number
  onPage: (page: number) => void
  openUserId: string | null
  onOpenUser: (id: string) => void
}) {
  const users = useAdminUsers({ page, pageSize: PAGE_SIZE, q: query || undefined })

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'UserName',
      cell: (user) => (
        // A real button so the details panel opens from the keyboard too.
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onOpenUser(user.id)
          }}
          className="flex max-w-[200px] items-center gap-2 text-left hover:underline"
        >
          <Avatar src={user.avatarUrl ?? undefined} name={user.fullName} size={24} />
          <span className="truncate">{user.fullName}</span>
        </button>
      ),
    },
    {
      key: 'id',
      header: 'User Id',
      // Full UUIDs are long; the first block is enough to tell rows apart (hover for the full id).
      cell: (user) => <span title={user.id}>{user.shortId}</span>,
    },
    { key: 'email', header: 'Email', cell: (user) => user.email },
    { key: 'reports', header: 'Reports', cell: (user) => user.reportCount || 'nil' },
    {
      key: 'joined',
      header: 'Joined',
      cell: (user) => <span className="whitespace-nowrap">{stamp(user.createdAt)}</span>,
    },
    { key: 'status', header: 'Status', align: 'center', cell: (user) => <RecordStatusBadge status={user.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      className: 'w-[80px]',
      // Its own clicks shouldn't also open the details panel.
      cell: (user) => (
        <span onClick={(event) => event.stopPropagation()}>
          <UserActions user={user} />
        </span>
      ),
    },
  ]

  return (
    <Panel className="py-[3px]">
      <PanelHeader
        title="Users"
        className="border-b border-hairline [&_h2]:text-body-m"
        action={<TableSearch value={search} onChange={onSearch} placeholder="Search users" />}
      />
      {users.isError ? (
        <ErrorState message={getErrorMessage(users.error)} onRetry={() => users.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={users.data?.data}
            rowKey={(user) => user.id}
            onRowClick={(user) => onOpenUser(user.id)}
            selectedKey={openUserId ?? undefined}
            loading={users.isFetching}
            headerTint={false}
            empty={query ? 'No users match your search.' : 'No users yet.'}
          />
          {users.data && (
            <Pagination
              page={users.data.page}
              pageSize={users.data.pageSize}
              total={users.data.total}
              shown={users.data.data.length}
              onPage={onPage}
            />
          )}
        </>
      )}
    </Panel>
  )
}

/* --------------------------------- Actions -------------------------------- */

type StatusAction = AdminSetUserStatusBody['action']

const ACTIONS: {
  action: StatusAction
  label: string
  done: string
  tone?: 'warning' | 'danger'
  /** Statuses the action makes no sense for. */
  hideFor: AdminUser['status'][]
  /** Heavier actions ask first. */
  confirm?: (name: string) => string
}[] = [
  { action: 'reinstate', label: 'Reinstate', done: 'reinstated', hideFor: ['active'] },
  {
    action: 'warn',
    label: 'Send warning',
    done: 'warned',
    tone: 'warning',
    hideFor: ['suspended', 'blocked'],
    confirm: (name) => `${name} is told why. Repeated warnings can lead to suspension.`,
  },
  {
    action: 'restrict',
    label: 'Restrict',
    done: 'restricted',
    tone: 'warning',
    hideFor: ['restricted', 'blocked'],
    confirm: (name) => `${name} can still sign in, but can’t post, comment or message until reinstated.`,
  },
  {
    action: 'suspend',
    label: 'Suspend',
    done: 'suspended',
    tone: 'danger',
    hideFor: ['suspended', 'blocked'],
    confirm: (name) => `${name} won’t be able to sign in until an admin reinstates them.`,
  },
  {
    action: 'block',
    label: 'Block',
    done: 'blocked',
    tone: 'danger',
    hideFor: ['blocked'],
    confirm: () =>
      'Are you sure you want to block this user? Blocking this account will restrict the user from accessing Communiti',
  },
]

function UserActions({ user }: { user: AdminUser }) {
  const setStatus = useSetUserStatus()
  const toast = useToast()
  const [confirming, setConfirming] = useState<(typeof ACTIONS)[number] | null>(null)

  const run = (item: (typeof ACTIONS)[number], reason = '') =>
    setStatus.mutate(
      { id: user.id, data: { action: item.action, ...(reason && { reason }) } },
      {
        onSuccess: () => {
          toast(`${user.fullName} ${item.done}`)
          setConfirming(null)
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )

  return (
    <>
      <Menu
        trigger={
          <IconButton label={`Actions for ${user.fullName}`} className="size-7 text-fg">
            <DotsThree weight="bold" className="size-[18px]" />
          </IconButton>
        }
        className="w-[200px]"
      >
        {(close) =>
          ACTIONS.filter((item) => !item.hideFor.includes(user.status)).map((item) => (
            <MenuItem
              key={item.action}
              size="sm"
              tone={item.tone}
              onSelect={() => {
                close()
                if (item.confirm) setConfirming(item)
                else run(item)
              }}
            >
              {item.label}
            </MenuItem>
          ))
        }
      </Menu>
      <ConfirmDialog
        open={confirming !== null}
        withReason
        title={`${confirming?.label ?? ''} ${user.fullName}?`}
        message={confirming?.confirm?.(user.fullName) ?? ''}
        confirmLabel={confirming?.label ?? ''}
        loading={setStatus.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={(reason) => confirming && run(confirming, reason)}
      />
    </>
  )
}
