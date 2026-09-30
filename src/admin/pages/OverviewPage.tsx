import { useDeferredValue, useState } from 'react'
import { adminPaths } from '../paths'
import { getErrorMessage } from '@/lib/api/client'
import { AdminTopBar } from '../components/AdminTopBar'
import { ActivityChart } from '../components/charts'
import { LogsTable } from '../components/LogsTable'
import { QueuePreviewTable } from '../components/ReportTables'
import { ErrorState, StatSkeleton } from '../components/states'
import { AdminContent, DateRangeSelect, Panel, PanelHeader, PanelLink, StatGrid } from '../components/ui'
import { useOverview } from '../hooks/queries'
import type { DateRange } from '../types'

const includes = (text: string, search: string) => text.toLowerCase().includes(search.toLowerCase())

/** Admin home (Figma "ADMIN" › Overview). */
export function OverviewPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const [search, setSearch] = useState('')
  const query = useDeferredValue(search.trim())
  const overview = useOverview(range)

  const queue = overview.data?.queue.filter((row) => includes(`${row.subject} ${row.type} ${row.reason}`, query))
  const logs = overview.data?.logs.filter((row) => includes(`${row.action} ${row.message}`, query))

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
            {overview.data ? <StatGrid stats={overview.data.stats} /> : <StatSkeleton />}
            <div className="grid gap-gap-lg xl:grid-cols-2">
              <ActivityChart title="User Activity" legend="Users per day" points={overview.data?.activity ?? []} />
              <Panel className="px-1.5 pt-[15px] pb-1">
                <PanelHeader
                  title="Moderation Queue"
                  action={<PanelLink to={adminPaths.moderation('overview')}>View All</PanelLink>}
                />
                <QueuePreviewTable section="overview" reports={queue} loading={overview.isPending} />
              </Panel>
            </div>
            <Panel className="py-[3px]">
              <PanelHeader
                title="Admin logs"
                action={<PanelLink to={adminPaths.logs}>See All</PanelLink>}
                className="[&_h2]:text-body-m"
              />
              <LogsTable logs={logs} loading={overview.isPending} />
            </Panel>
          </>
        )}
      </AdminContent>
    </>
  )
}
