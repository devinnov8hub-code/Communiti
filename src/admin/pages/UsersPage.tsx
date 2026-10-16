import { DotsThree } from '@phosphor-icons/react'
import { useDeferredValue, useState } from 'react'
import { Avatar, ConfirmDialog, IconButton, Menu, MenuItem, useToast } from '@/components/ui'
import type {
  AdminGetOverviewStatsResponse,
  AdminGetUserActivityStatsResponse,
  AdminSetUserStatusBody,
  AdminUser,
} from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { ActivityChart } from '../components/charts'
import { PendingReportsTable } from '../components/ReportTables'
import { USER_STAT_ICONS } from '../components/statIcons'
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
import type { DateRange, StatCardData } from '../types'

const PAGE_SIZE = 10

const stamp = (iso: string) => iso.replace('T', ' ').slice(0, 19)
const percentChange = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : undefined

/** Total / Active / New / Blocked cards (Figma "USERS"). */
function statCards(stats: AdminGetOverviewStatsResponse): StatCardData[] {
  return [
    { id: 'total', label: 'Total', caption: 'All members', value: stats.totalUsers, tone: 'indigo' },
    { id: 'active', label: 'Active', caption: 'Last 30 days', value: stats.activeUsers30d, tone: 'green' },
    {
      id: 'new',
      label: 'New',
      caption: 'This week',
      value: stats.newUsers7d,
      change: percentChange(stats.newUsers7d, stats.newUsersPrev7d),
      tone: 'orange',
    },
    {
      id: 'blocked',
      label: 'Blocked',
      caption: `${stats.suspendedUsers} suspended`,
      value: stats.blockedUsers,
      tone: 'red',
    },
  ]
}

function signupBars(activity: AdminGetUserActivityStatsResponse) {
  const label = new Intl.DateTimeFormat(
    'en',
    activity.bucket === 'month' ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' },
  )
  return activity.data.map((point) => ({ label: label.format(new Date(point.date)), value: point.signups }))
}

/** Users dashboard (Figma "USERS"), on real backend data. */
export function UsersPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useDeferredValue(search.trim())
  const dashboard = useUsersDashboard(range)

  // The top-bar search and the table search are the same search.
  const onSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <>
      <AdminTopBar title="Users" searchPlaceholder="Search users" search={search} onSearch={onSearch} />
      <AdminContent>
        <DateRangeSelect value={range} onChange={setRange} />
        {dashboard.isError ? (
          <ErrorState message={getErrorMessage(dashboard.error)} onRetry={() => dashboard.refetch()} />
        ) : (
          <>
            {dashboard.data ? (
              <StatGrid stats={statCards(dashboard.data.stats)} icons={USER_STAT_ICONS} />
            ) : (
              <StatSkeleton />
            )}
            <div className="grid gap-gap-lg xl:grid-cols-2">
              <ActivityChart
                title="User Activity"
                legend={range === '12m' ? 'Sign-ups per month' : 'Sign-ups per day'}
                points={dashboard.data ? signupBars(dashboard.data.activity) : []}
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
        <UsersTable search={search} query={query} onSearch={onSearch} page={page} onPage={setPage} />
      </AdminContent>
    </>
  )
}

/* ---------------------------------- Table --------------------------------- */

function UsersTable({
  search,
  query,
  onSearch,
  page,
  onPage,
}: {
  search: string
  query: string
  onSearch: (value: string) => void
  page: number
  onPage: (page: number) => void
}) {
  const users = useAdminUsers({ page, pageSize: PAGE_SIZE, q: query || undefined })

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'UserName',
      cell: (user) => (
        <span className="flex max-w-[200px] items-center gap-2">
          <Avatar src={user.avatarUrl ?? undefined} name={user.fullName} size={24} />
          <span className="truncate">{user.fullName}</span>
        </span>
      ),
    },
    {
      key: 'id',
      header: 'User Id',
      // Full UUIDs are long; the first block is enough to tell rows apart (hover for the full id).
      cell: (user) => <span title={user.id}>{user.id.slice(0, 8)}</span>,
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
      cell: (user) => <UserActions user={user} />,
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
  { action: 'warn', label: 'Send warning', done: 'warned', tone: 'warning', hideFor: ['suspended', 'blocked'] },
  { action: 'restrict', label: 'Restrict', done: 'restricted', tone: 'warning', hideFor: ['restricted', 'blocked'] },
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
    confirm: (name) => `${name} will be blocked from CommUniti.`,
  },
]

function UserActions({ user }: { user: AdminUser }) {
  const setStatus = useSetUserStatus()
  const toast = useToast()
  const [confirming, setConfirming] = useState<(typeof ACTIONS)[number] | null>(null)

  const run = (item: (typeof ACTIONS)[number]) =>
    setStatus.mutate(
      { id: user.id, data: { action: item.action } },
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
        title={`${confirming?.label ?? ''} ${user.fullName}?`}
        message={confirming?.confirm?.(user.fullName) ?? ''}
        confirmLabel={confirming?.label ?? ''}
        loading={setStatus.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={() => confirming && run(confirming)}
      />
    </>
  )
}
