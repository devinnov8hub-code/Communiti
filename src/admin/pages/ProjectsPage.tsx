import { DotsThree } from '@phosphor-icons/react'
import { useDeferredValue, useState } from 'react'
import { Avatar, ConfirmDialog, IconButton, Menu, MenuItem, useToast } from '@/components/ui'
import type { AdminGetOverviewStatsResponse, AdminListProjectsResponse } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { titleCase } from '@/lib/format'
import { AdminTopBar } from '../components/AdminTopBar'
import { DistributionChart } from '../components/charts'
import { PendingReportsTable } from '../components/ReportTables'
import { PROJECT_STAT_ICONS } from '../components/statIcons'
import { ErrorState, StatSkeleton } from '../components/states'
import {
  AdminContent,
  DataTable,
  Pagination,
  Panel,
  PanelHeader,
  PanelLink,
  RecordStatusBadge,
  StatGrid,
  TableSearch,
  type Column,
} from '../components/ui'
import { useAdminProjects, useProjectsDashboard, useSetContentRemoved } from '../hooks/queries'
import { adminPaths } from '../paths'
import type { DistributionSlice, RecordStatus, StatCardData } from '../types'

type AdminProject = AdminListProjectsResponse['data'][number]

const PAGE_SIZE = 10

const stamp = (iso: string) => iso.replace('T', ' ').slice(0, 19)
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const isActive = (project: AdminProject) => project.status === 'open' || project.status === 'ongoing'

/** Total / Active cards ("PROJECTS"). */
function statCards(stats: AdminGetOverviewStatsResponse, projects: AdminProject[], sampled: boolean): StatCardData[] {
  return [
    { id: 'total', label: 'Total', caption: 'Created projects', value: stats.totalProjects, tone: 'violet' },
    {
      id: 'active',
      label: 'Active',
      caption: sampled ? `Open or ongoing, newest ${projects.length}` : 'Open or ongoing',
      value: projects.filter(isActive).length,
      tone: 'green',
    },
      {
      id: 'completed',
      label: 'Completed',
      caption: sampled ? `Completed, newest ${projects.length}` : 'Completed',
      value: projects.filter((project) => project.status === 'completed').length,
      tone: 'blue',
    },
      {
      id: 'new',
      label: 'New',
      caption: sampled ? `new, newest ${projects.length}` : 'New',
      value: projects.filter((project) => project.status === 'new').length,
      tone: 'orange',
    }
  ]
}

/** Figma's four slices. A featured project counts as Featured whatever its status. */
function distribution(projects: AdminProject[]): DistributionSlice[] {
  const count = (test: (project: AdminProject) => boolean) => projects.filter(test).length
  const notFeatured = (test: (project: AdminProject) => boolean) => (project: AdminProject) =>
    project.featuredAt === null && test(project)
  return [
    { label: 'Featured', value: count((project) => project.featuredAt !== null), tone: 'blue' },
    { label: 'In Development', value: count(notFeatured(isActive)), tone: 'orange' },
    { label: 'Inactive', value: count(notFeatured((project) => project.status === 'archived')), tone: 'grey' },
    { label: 'Completed', value: count(notFeatured((project) => project.status === 'completed')), tone: 'green' },
  ]
}

/** Removed projects show "Removed"; otherwise their lifecycle status. */
const statusOf = (project: AdminProject): RecordStatus =>
  project.removedAt ? 'removed' : (project.status as RecordStatus)

/** Projects dashboard (Figma "PROJECTS"), on real backend data. */
export function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useDeferredValue(search.trim())
  const dashboard = useProjectsDashboard()

  // The top-bar search and the table search are the same search.
  const onSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <>
      <AdminTopBar title="Projects" searchPlaceholder="Search projects" search={search} onSearch={onSearch} />
      <AdminContent>
        {dashboard.isError ? (
          <ErrorState message={getErrorMessage(dashboard.error)} onRetry={() => dashboard.refetch()} />
        ) : (
          <>
            {dashboard.data ? (
              <StatGrid
                stats={statCards(dashboard.data.stats, dashboard.data.projects, dashboard.data.sampled)}
                icons={PROJECT_STAT_ICONS}
              />
            ) : (
              <StatSkeleton count={2} />
            )}
            <div className="grid gap-gap-lg xl:grid-cols-2">
              <DistributionChart
                title="Project distribution"
                slices={dashboard.data ? distribution(dashboard.data.projects) : []}
              />
              <Panel className="px-1.5 pt-[15px] pb-1">
                <PanelHeader
                  title="Project moderation"
                  action={<PanelLink to={adminPaths.moderation('projects')}>View All</PanelLink>}
                />
                <PendingReportsTable
                  reports={dashboard.data?.reports}
                  loading={dashboard.isPending}
                  nameHeader="Project / Owner"
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
      cell: (project) => <span title={project.id}>{project.id.slice(0, 8)}</span>,
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
    { key: 'visibility', header: 'Visibility', cell: (project) => titleCase(project.visibility) },
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
      cell: (project) => <ProjectActions project={project} />,
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

/* --------------------------------- Actions -------------------------------- */

/** Remove (hide from members, asks first) or restore a project. */
function ProjectActions({ project }: { project: AdminProject }) {
  const setRemoved = useSetContentRemoved('project')
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const removed = project.removedAt !== null

  const run = (remove: boolean) =>
    setRemoved.mutate(
      { id: project.id, removed: remove },
      {
        onSuccess: () => {
          toast(`${project.name} ${remove ? 'removed' : 'restored'}`)
          setConfirming(false)
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )

  return (
    <>
      <Menu
        trigger={
          <IconButton label={`Actions for ${project.name}`} className="size-7 text-fg">
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
              Restore project
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
              Remove project
            </MenuItem>
          )
        }
      </Menu>
      <ConfirmDialog
        open={confirming}
        title={`Remove ${project.name}?`}
        message="Members will no longer see this project. You can restore it later."
        confirmLabel="Remove"
        loading={setRemoved.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() => run(true)}
      />
    </>
  )
}
