import { useDeferredValue, useState } from 'react'
import type { AdminGetOverviewStatsResponse, AdminGetUserActivityStatsResponse } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { ActivityChart } from '../components/charts'
import { AuditLogTable } from '../components/LogsTable'
import { PendingReportsTable } from '../components/ReportTables'
import { ErrorState, StatSkeleton } from '../components/states'
import { AdminContent, DateRangeSelect, Panel, PanelHeader, PanelLink, StatGrid } from '../components/ui'
import { useOverview } from '../hooks/queries'
import { adminPaths } from '../paths'
import type { DateRange, StatCardData } from '../types'

const includes = (text: string, search: string) => text.toLowerCase().includes(search.toLowerCase())

/** Week-over-week change in percent; undefined when last week was empty (nothing to compare). */
const percentChange = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : undefined

/** The four KPI cards ("Card Container"). */
function statCards(stats: AdminGetOverviewStatsResponse): StatCardData[] {
  return [
    {
      id: 'users',
      label: 'Total Users',
      caption: `${stats.newUsers7d} new this week`,
      value: stats.totalUsers,
      change: percentChange(stats.newUsers7d, stats.newUsersPrev7d),
      tone: 'orange',
    },
    { id: 'posts', label: 'Posts', caption: `${stats.posts7d} this week`, value: stats.totalPosts, tone: 'green' },
    { id: 'forums', label: 'Forums', caption: 'All time', value: stats.totalForums, tone: 'indigo' },
    { id: 'projects', label: 'Projects', caption: 'All time', value: stats.totalProjects, tone: 'violet' },
  ]
}

/** Sign-ups per day (or per month for 12 months) as chart bars. */
function signupBars(activity: AdminGetUserActivityStatsResponse) {
  const label = new Intl.DateTimeFormat(
    'en',
    activity.bucket === 'month' ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' },
  )
  return activity.data.map((point) => ({ label: label.format(new Date(point.date)), value: point.signups }))
}

/** Admin home ("ADMIN" › Overview), on real backend data. */
export function OverviewPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const [search, setSearch] = useState('')
  const query = useDeferredValue(search.trim())
  const overview = useOverview(range)

  const reports = overview.data?.reports.filter((report) =>
    includes(
      `${report.targetUser?.fullName ?? ''} ${report.preview ?? ''} ${report.targetType} ${report.reason}`,
      query,
    ),
  )
  const logs = overview.data?.logs.filter((entry) => includes(`${entry.action} ${entry.message ?? ''}`, query))

  return (
    <>
      <AdminTopBar
        title="Overview"
        searchPlaceholder="Search users, posts, reports..."
        search={search}
        onSearch={setSearch}
      />
      <AdminContent>
        <DateRangeSelect value={range} onChange={setRange} />
        {overview.isError ? (
          <ErrorState message={getErrorMessage(overview.error)} onRetry={() => overview.refetch()} />
        ) : (
          <>
            {overview.data ? <StatGrid stats={statCards(overview.data.stats)} /> : <StatSkeleton />}
            <div className="grid gap-gap-lg xl:grid-cols-2">
              <ActivityChart
                title="User Activity"
                legend={range === '12m' ? 'Sign-ups per month' : 'Sign-ups per day'}
                points={overview.data ? signupBars(overview.data.activity) : []}
              />
              <Panel className="px-1.5 pt-[15px] pb-1">
                <PanelHeader
                  title="Moderation Queue"
                  action={<PanelLink to={adminPaths.moderation('overview')}>View All</PanelLink>}
                />
                <PendingReportsTable reports={reports} loading={overview.isPending} />
              </Panel>
            </div>
            <Panel className="py-[3px]">
              <PanelHeader
                title="Admin logs"
                action={<PanelLink to={adminPaths.logs}>See All</PanelLink>}
                className="[&_h2]:text-body-m"
              />
              <AuditLogTable entries={logs} loading={overview.isPending} />
            </Panel>
          </>
        )}
      </AdminContent>
    </>
  )
}
