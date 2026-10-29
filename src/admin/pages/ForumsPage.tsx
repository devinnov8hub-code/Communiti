import { useDeferredValue, useState } from 'react'
import { Avatar } from '@/components/ui'
import type { AdminGetForumStatsResponse, AdminListForumsResponse } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { ActivityChart } from '../components/charts'
import { GroupActions } from '../components/GroupActions'
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
import { useAdminForums, useForumsDashboard } from '../hooks/queries'
import { adminPaths } from '../paths'
import { activityBars, kpiCard, rangeLabel } from '../stats'
import type { DateRange, StatCardData } from '../types'

type AdminForum = AdminListForumsResponse['data'][number]

const PAGE_SIZE = 10

const stamp = (iso: string) => iso.replace('T', ' ').slice(0, 19)
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** Total / Active / Restricted / Flagged ("FORUMNS"). */
function statCards(stats: AdminGetForumStatsResponse, range: DateRange): StatCardData[] {
  const caption = rangeLabel(range)
  return [
    kpiCard('total', 'Total', caption, stats.total, 'indigo'),
    kpiCard('active', 'Active', caption, stats.active, 'green'),
    kpiCard('restricted', 'Restricted', caption, stats.restricted, 'red'),
    kpiCard('flagged', 'Flagged', caption, stats.flagged, 'orange'),
  ]
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
              <StatGrid stats={statCards(dashboard.data.stats, range)} icons={FORUM_STAT_ICONS} />
            ) : (
              <StatSkeleton />
            )}
            <div className="grid gap-gap-lg xl:grid-cols-2">
              <ActivityChart
                title="Forum Activity"
                legend={range === '12m' ? 'Posts per month' : 'Posts per day'}
                points={dashboard.data ? activityBars(dashboard.data.activity, 'forumPosts') : []}
              />
              <Panel className="px-1.5 pt-[15px] pb-1">
                <PanelHeader
                  title="Moderation Queue"
                  action={<PanelLink to={adminPaths.moderation('forums')}>View All</PanelLink>}
                />
                <PendingReportsTable
                  reports={dashboard.data?.reports}
                  loading={dashboard.isPending}
                  nameHeader="Forum Name"
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
      cell: (forum) => <span title={forum.id}>{forum.shortId}</span>,
    },
    { key: 'creator', header: 'Creator / Moderator', cell: (forum) => forum.owner.fullName },
    { key: 'members', header: 'Members', cell: (forum) => compact.format(forum.memberCount).toLowerCase() },
    { key: 'reports', header: 'Reports', cell: (forum) => forum.reportCount || 'nil' },
    {
      key: 'created',
      header: 'Date created',
      cell: (forum) => <span className="whitespace-nowrap">{stamp(forum.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (forum) => <RecordStatusBadge status={forum.removedAt ? 'removed' : forum.moderationStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      className: 'w-[80px]',
      cell: (forum) => (
        <GroupActions
          type="forum"
          id={forum.id}
          name={forum.name}
          status={forum.moderationStatus}
          removed={forum.removedAt !== null}
        />
      ),
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
