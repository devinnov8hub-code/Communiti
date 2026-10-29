import { useDeferredValue, useState } from 'react'
import type { AdminGetOverviewStatsResponse } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { ActivityChart } from '../components/charts'
import { AuditLogTable } from '../components/LogsTable'
import { PendingReportsTable } from '../components/ReportTables'
import { ErrorState, StatSkeleton } from '../components/states'
import { AdminContent, DateRangeSelect, Panel, PanelHeader, PanelLink, StatGrid } from '../components/ui'
import { useOverview } from '../hooks/queries'
import { adminPaths } from '../paths'
import { activityBars, kpiCard, rangeLabel } from '../stats'
import type { DateRange, StatCardData } from '../types'

const includes = (text: string, search: string) => text.toLowerCase().includes(search.toLowerCase())

/** The four KPI cards ("Card Container"). */
function statCards({ cards }: AdminGetOverviewStatsResponse, range: DateRange): StatCardData[] {
  const caption = rangeLabel(range)
  return [
    kpiCard('users', 'Total Users', caption, cards.totalUsers, 'orange'),
    kpiCard('events', 'Active Events', 'Currently running', cards.activeEvents, 'green'),
    kpiCard('forums', 'Active Forums', caption, cards.activeForums, 'indigo'),
    kpiCard('projects', 'Active Projects', caption, cards.activeProjects, 'violet'),
  ]
}

/** Admin home ("ADMIN" › Overview), on real backend data. */
export function OverviewPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const [search, setSearch] = useState('')
  const query = useDeferredValue(search.trim())
  const overview = useOverview(range)

  const reports = overview.data?.reports.filter((report) =>
    includes(`${report.targetName ?? ''} ${report.preview ?? ''} ${report.targetType} ${report.reason}`, query),
  )
  const logs = overview.data?.logs.filter((entry) => includes(`${entry.label} ${entry.details}`, query))

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
            {overview.data ? <StatGrid stats={statCards(overview.data.stats, range)} /> : <StatSkeleton />}
            <div className="grid gap-gap-lg xl:grid-cols-2">
              <ActivityChart
                title="User Activity"
                legend={range === '12m' ? 'Sign-ups per month' : 'Sign-ups per day'}
                points={overview.data ? activityBars(overview.data.activity, 'signups') : []}
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
