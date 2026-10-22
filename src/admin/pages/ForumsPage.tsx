import { DotsThree } from '@phosphor-icons/react'
import { useDeferredValue, useState } from 'react'
import { Avatar, ConfirmDialog, IconButton, Menu, MenuItem, useToast } from '@/components/ui'
import type {
  AdminGetOverviewStatsResponse,
  AdminGetUserActivityStatsResponse,
  AdminListForumsResponse,
} from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { titleCase } from '@/lib/format'
import { AdminTopBar } from '../components/AdminTopBar'
import { ActivityChart } from '../components/charts'
import { PendingReportsTable } from '../components/ReportTables'
import { FORUM_STAT_ICONS } from '../components/statIcons'
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
import { useAdminForums, useForumsDashboard, useSetForumRemoved } from '../hooks/queries'
import { adminPaths } from '../paths'
import type { DateRange, StatCardData } from '../types'

type AdminForum = AdminListForumsResponse['data'][number]

const PAGE_SIZE = 10

const stamp = (iso: string) => iso.replace('T', ' ').slice(0, 19)
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** Total forums / pending forum reports / posts this week ( "FORUMNS"). */
function statCards(stats: AdminGetOverviewStatsResponse, pendingReports: number): StatCardData[] {
  return [
    { id: 'total', label: 'Total', caption: 'All forums', value: stats.totalForums, tone: 'indigo' },
    { id: 'flagged', label: 'Flagged', caption: 'Pending reports', value: pendingReports, tone: 'orange' },
    { id: 'posts', label: 'Posts', caption: 'Last 7 days', value: stats.posts7d, tone: 'green' },
  ]
}

function postBars(activity: AdminGetUserActivityStatsResponse) {
  const label = new Intl.DateTimeFormat(
    'en',
    activity.bucket === 'month' ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' },
  )
  return activity.data.map((point) => ({ label: label.format(new Date(point.date)), value: point.posts }))
}

/** Forums dashboard ("FORUMNS"), on real backend data. */
export function ForumsPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useDeferredValue(search.trim())
  const dashboard = useForumsDashboard(range)

  // The top-bar search and the table search are the same search.
  const onSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <>
      <AdminTopBar title="Forums" searchPlaceholder="Search forums" search={search} onSearch={onSearch} />
      <AdminContent>
        <DateRangeSelect value={range} onChange={setRange} />
        {dashboard.isError ? (
          <ErrorState message={getErrorMessage(dashboard.error)} onRetry={() => dashboard.refetch()} />
        ) : (
          <>
            {dashboard.data ? (
              <StatGrid
                stats={statCards(dashboard.data.stats, dashboard.data.pendingReports)}
                icons={FORUM_STAT_ICONS}
              />
            ) : (
              <StatSkeleton count={3} />
            )}
            <div className="grid gap-gap-lg xl:grid-cols-2">
              <ActivityChart
                title="Post Activity"
                legend={range === '12m' ? 'Posts per month' : 'Posts per day'}
                points={dashboard.data ? postBars(dashboard.data.activity) : []}
              />
              <Panel className="px-1.5 pt-[15px] pb-1">
                <PanelHeader
                  title="Moderation Queue"
                  action={<PanelLink to={adminPaths.moderation('forums')}>View All</PanelLink>}
                />
                <PendingReportsTable
                  reports={dashboard.data?.reports}
                  loading={dashboard.isPending}
                  nameHeader="Forum / Owner"
                  showType={false}
                />
              </Panel>
            </div>
          </>
        )}
        <ForumsTable search={search} query={query} onSearch={onSearch} page={page} onPage={setPage} />
      </AdminContent>
    </>
  )
}

/* ---------------------------------- Table --------------------------------- */

function ForumsTable({
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
  const forums = useAdminForums({ page, pageSize: PAGE_SIZE, q: query || undefined })

  const columns: Column<AdminForum>[] = [
    {
      key: 'name',
      header: 'Forum Name',
      cell: (forum) => (
        <span className="flex max-w-[180px] items-center gap-1.5">
          <Avatar name={forum.name} size={20} />
          <span className="truncate">{forum.name}</span>
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Forum Id',
      // Full UUIDs are long; the first block is enough to tell rows apart (hover for the full id).
      cell: (forum) => <span title={forum.id}>{forum.id.slice(0, 8)}</span>,
    },
    { key: 'creator', header: 'Creator', cell: (forum) => forum.owner.fullName },
    { key: 'members', header: 'Members', cell: (forum) => compact.format(forum.memberCount).toLowerCase() },
    { key: 'visibility', header: 'Visibility', cell: (forum) => titleCase(forum.visibility) },
    {
      key: 'created',
      header: 'Date created',
      cell: (forum) => <span className="whitespace-nowrap">{stamp(forum.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (forum) => <RecordStatusBadge status={forum.removedAt ? 'removed' : 'active'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      className: 'w-[80px]',
      cell: (forum) => <ForumActions forum={forum} />,
    },
  ]

  return (
    <Panel className="py-[3px]">
      <PanelHeader
        title="All Forums"
        className="border-b border-hairline [&_h2]:text-body-m"
        action={<TableSearch value={search} onChange={onSearch} placeholder="Search forums" />}
      />
      {forums.isError ? (
        <ErrorState message={getErrorMessage(forums.error)} onRetry={() => forums.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={forums.data?.data}
            rowKey={(forum) => forum.id}
            loading={forums.isFetching}
            headerTint={false}
            empty={query ? 'No forums match your search.' : 'No forums yet.'}
          />
          {forums.data && (
            <Pagination
              page={forums.data.page}
              pageSize={forums.data.pageSize}
              total={forums.data.total}
              shown={forums.data.data.length}
              onPage={onPage}
            />
          )}
        </>
      )}
    </Panel>
  )
}

/* --------------------------------- Actions -------------------------------- */

/** Remove (hide from members, asks first) or restore a forum. */
function ForumActions({ forum }: { forum: AdminForum }) {
  const setRemoved = useSetForumRemoved()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const removed = forum.removedAt !== null

  const run = (remove: boolean) =>
    setRemoved.mutate(
      { id: forum.id, removed: remove },
      {
        onSuccess: () => {
          toast(`${forum.name} ${remove ? 'removed' : 'restored'}`)
          setConfirming(false)
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )

  return (
    <>
      <Menu
        trigger={
          <IconButton label={`Actions for ${forum.name}`} className="size-7 text-fg">
            <DotsThree weight="bold" className="size-[18px]" />
          </IconButton>
        }
        className="w-[200px]"
      >
        {(close) =>
          removed ? (
            <MenuItem
              size="sm"
              onSelect={() => {
                close()
                run(false)
              }}
            >
              Restore forum
            </MenuItem>
          ) : (
            <MenuItem
              size="sm"
              tone="danger"
              onSelect={() => {
                close()
                setConfirming(true)
              }}
            >
              Remove forum
            </MenuItem>
          )
        }
      </Menu>
      <ConfirmDialog
        open={confirming}
        title={`Remove ${forum.name}?`}
        message="Members will no longer see this forum or its posts. You can restore it later."
        confirmLabel="Remove"
        loading={setRemoved.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() => run(true)}
      />
    </>
  )
}
