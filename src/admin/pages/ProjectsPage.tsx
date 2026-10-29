import { useDeferredValue, useState } from 'react'
import { Avatar } from '@/components/ui'
import type { AdminGetProjectStatsResponse, AdminListProjectsResponse } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { DistributionChart } from '../components/charts'
import { GroupActions } from '../components/GroupActions'
import { PendingReportsTable } from '../components/ReportTables'
import { PROJECT_STAT_ICONS } from '../components/statIcons'
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
import { useAdminProjects, useProjectsDashboard } from '../hooks/queries'
import { adminPaths } from '../paths'
import { kpiCard, rangeLabel } from '../stats'
import type { DateRange, DistributionSlice, RecordStatus, StatCardData } from '../types'

type AdminProject = AdminListProjectsResponse['data'][number]

const PAGE_SIZE = 10

const stamp = (iso: string) => iso.replace('T', ' ').slice(0, 19)
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** Total / Active / Completed / New ("PROJECTS"). */
function statCards(stats: AdminGetProjectStatsResponse, range: DateRange): StatCardData[] {
  const caption = rangeLabel(range)
  return [
    kpiCard('total', 'Total', 'Created projects', stats.total, 'violet'),
    kpiCard('active', 'Active', caption, stats.active, 'green'),
    kpiCard('completed', 'Completed', caption, stats.completed, 'blue'),
    kpiCard('new', 'New', caption, stats.new, 'orange'),
  ]
}

/** Figma's four donut slices. */
function distribution({ distribution: slices }: AdminGetProjectStatsResponse): DistributionSlice[] {
  return [
    { label: 'Featured', value: slices.featured.count, tone: 'blue' },
    { label: 'In Development', value: slices.inDevelopment.count, tone: 'orange' },
    { label: 'Inactive', value: slices.inactive.count, tone: 'grey' },
    { label: 'Completed', value: slices.completed.count, tone: 'green' },
  ]
}

/** Status pill: removed, or the moderation status (projects call "flagged" Warned). */
const statusOf = (project: AdminProject): RecordStatus =>
  project.removedAt ? 'removed' : project.moderationStatus === 'flagged' ? 'warned' : project.moderationStatus

/** Projects dashboard (Figma "PROJECTS"), on real backend data. */
export function ProjectsPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useDeferredValue(search.trim())
  const dashboard = useProjectsDashboard(range)

  // The top-bar search and the table search are the same search.
  const onSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <>
      <AdminTopBar title="Projects" searchPlaceholder="Search projects" search={search} onSearch={onSearch} />
      <AdminContent>
        <DateRangeSelect value={range} onChange={setRange} />
        {dashboard.isError ? (
          <ErrorState message={getErrorMessage(dashboard.error)} onRetry={() => dashboard.refetch()} />
        ) : (
          <>
            {dashboard.data ? (
              <StatGrid stats={statCards(dashboard.data.stats, range)} icons={PROJECT_STAT_ICONS} />
            ) : (
              <StatSkeleton />
            )}
            <div className="grid gap-gap-lg xl:grid-cols-2">
              <DistributionChart
                title="Project distribution"
                slices={dashboard.data ? distribution(dashboard.data.stats) : []}
              />
              <Panel className="px-1.5 pt-[15px] pb-1">
                <PanelHeader
                  title="Project moderation"
                  action={<PanelLink to={adminPaths.moderation('projects')}>View All</PanelLink>}
                />
                <PendingReportsTable
                  reports={dashboard.data?.reports}
                  loading={dashboard.isPending}
                  nameHeader="Project Name"
                  showType={false}
                />
              </Panel>
            </div>
          </>
        )}
        <ProjectsTable search={search} query={query} onSearch={onSearch} page={page} onPage={setPage} />
      </AdminContent>
    </>
  )
}

/* ---------------------------------- Table --------------------------------- */

function ProjectsTable({
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
  const projects = useAdminProjects({ page, pageSize: PAGE_SIZE, q: query || undefined })

  const columns: Column<AdminProject>[] = [
    {
      key: 'name',
      header: 'Project',
      cell: (project) => <span className="block max-w-[160px] truncate">{project.name}</span>,
    },
    {
      key: 'id',
      header: 'Project Id',
      // Full UUIDs are long; the first block is enough to tell rows apart (hover for the full id).
      cell: (project) => <span title={project.id}>{project.shortId}</span>,
    },
    {
      key: 'creator',
      header: 'Creator',
      cell: (project) => (
        <span className="flex max-w-[180px] items-center gap-1.5">
          <Avatar src={project.owner.avatarUrl ?? undefined} name={project.owner.fullName} size={20} />
          <span className="truncate">{project.owner.fullName}</span>
        </span>
      ),
    },
    { key: 'members', header: 'Members', cell: (project) => compact.format(project.memberCount).toLowerCase() },
    { key: 'reports', header: 'Reports', cell: (project) => project.reportCount || 'nil' },
    {
      key: 'created',
      header: 'Date created',
      cell: (project) => <span className="whitespace-nowrap">{stamp(project.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (project) => <RecordStatusBadge status={statusOf(project)} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      className: 'w-[80px]',
      cell: (project) => (
        <GroupActions
          type="project"
          id={project.id}
          name={project.name}
          status={project.moderationStatus}
          removed={project.removedAt !== null}
        />
      ),
    },
  ]

  return (
    <Panel className="py-[3px]">
      <PanelHeader
        title="All projects"
        className="border-b border-hairline [&_h2]:text-body-m"
        action={<TableSearch value={search} onChange={onSearch} placeholder="Search project" />}
      />
      {projects.isError ? (
        <ErrorState message={getErrorMessage(projects.error)} onRetry={() => projects.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={projects.data?.data}
            rowKey={(project) => project.id}
            loading={projects.isFetching}
            headerTint={false}
            empty={query ? 'No projects match your search.' : 'No projects yet.'}
          />
          {projects.data && (
            <Pagination
              page={projects.data.page}
              pageSize={projects.data.pageSize}
              total={projects.data.total}
              shown={projects.data.data.length}
              onPage={onPage}
            />
          )}
        </>
      )}
    </Panel>
  )
}
