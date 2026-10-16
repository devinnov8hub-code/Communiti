import { DotsThree } from '@phosphor-icons/react'
import { useDeferredValue, useState } from 'react'
import { adminPaths } from '../paths'
import { Avatar, IconButton, Menu, MenuItem, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { ActivityChart, DistributionChart } from '../components/charts'
import { QueuePreviewTable } from '../components/ReportTables'
import { FORUM_STAT_ICONS, PROJECT_STAT_ICONS } from '../components/statIcons'
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
import { useRecords, useSectionDashboard, useUpdateRecord } from '../hooks/queries'
import type { AdminForumRow, AdminProjectRow, DateRange, RecordAction, RecordStatus } from '../types'

// Users moved to UsersPage.tsx (real backend); Forums and Projects are still on sample data.
type Kind = 'forums' | 'projects'

const stamp = (iso: string) => iso.replace('T', ' ').slice(0, 19)
const count = (value: number) => (value === 0 ? 'nil' : value)
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

const CONFIG = {
  forums: {
    title: 'Forums',
    activity: { title: 'Forum Activity', legend: 'Posts per day' },
    queueTitle: 'Moderation Queue',
    tableTitle: 'All Forums',
    searchLabel: 'Search forums',
    icons: FORUM_STAT_ICONS,
  },
  projects: {
    title: 'Projects',
    activity: null,
    queueTitle: 'Project moderation',
    tableTitle: 'All projects',
    searchLabel: 'Search project',
    icons: PROJECT_STAT_ICONS,
  },
} as const

/** Forums / Projects dashboards (Figma "FORUMNS", "PROJECTS") — sample data. */
function SectionPage({ kind }: { kind: Kind }) {
  const config = CONFIG[kind]
  const [range, setRange] = useState<DateRange>('30d')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(search.trim())
  const dashboard = useSectionDashboard(kind, range)

  const onSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <>
      <AdminTopBar title={config.title} searchPlaceholder="Search in overview" search={search} onSearch={onSearch} />
      <AdminContent>
        {kind !== 'projects' && <DateRangeSelect value={range} onChange={setRange} />}
        {dashboard.isError ? (
          <ErrorState message={getErrorMessage(dashboard.error)} onRetry={() => dashboard.refetch()} />
        ) : (
          <>
            {dashboard.data ? (
              <StatGrid stats={dashboard.data.stats} icons={config.icons} />
            ) : (
              <StatSkeleton count={kind === 'projects' ? 2 : 4} />
            )}
            <div className="grid gap-gap-lg xl:grid-cols-2">
              {config.activity ? (
                <ActivityChart
                  title={config.activity.title}
                  legend={config.activity.legend}
                  points={dashboard.data?.activity ?? []}
                />
              ) : (
                <DistributionChart title="Project distribution" slices={dashboard.data?.distribution ?? []} />
              )}
              <Panel className="px-1.5 pt-[15px] pb-1">
                <PanelHeader
                  title={config.queueTitle}
                  action={<PanelLink to={adminPaths.moderation(kind)}>View All</PanelLink>}
                />
                <QueuePreviewTable section={kind} reports={dashboard.data?.queue} loading={dashboard.isPending} />
              </Panel>
            </div>
          </>
        )}
        <RecordsPanel
          kind={kind}
          search={search}
          query={deferredSearch}
          onSearch={onSearch}
          page={page}
          onPage={setPage}
        />
      </AdminContent>
    </>
  )
}

export const ForumsPage = () => <SectionPage kind="forums" />
export const ProjectsPage = () => <SectionPage kind="projects" />

/* --------------------------------- Records -------------------------------- */

const ACTIONS: { action: RecordAction; label: string; hideFor: RecordStatus[]; tone?: 'warning' | 'danger' }[] = [
  { action: 'activate', label: 'Mark as active', hideFor: ['active'] },
  { action: 'warn', label: 'Send warning', hideFor: ['warned'], tone: 'warning' },
  { action: 'restrict', label: 'Restrict', hideFor: ['restricted'], tone: 'warning' },
  { action: 'suspend', label: 'Suspend', hideFor: ['suspended'], tone: 'danger' },
]

function RowActions({ kind, id, name, status }: { kind: Kind; id: string; name: string; status: RecordStatus }) {
  const update = useUpdateRecord(kind)
  const toast = useToast()
  return (
    <Menu
      trigger={
        <IconButton label={`Actions for ${name}`} className="size-7 text-fg">
          <DotsThree weight="bold" className="size-[18px]" />
        </IconButton>
      }
      className="w-[200px]"
    >
      {(close) =>
        ACTIONS.filter((item) => !item.hideFor.includes(status)).map((item) => (
          <MenuItem
            key={item.action}
            size="sm"
            tone={item.tone}
            onSelect={() => {
              close()
              update.mutate(
                { id, action: item.action },
                {
                  onSuccess: () => toast(`${name} updated`),
                  onError: (error) => toast(getErrorMessage(error)),
                },
              )
            }}
          >
            {item.label}
          </MenuItem>
        ))
      }
    </Menu>
  )
}

const status = (row: { status: RecordStatus }) => <RecordStatusBadge status={row.status} />

function columnsFor(kind: Kind): Column<AdminForumRow>[] | Column<AdminProjectRow>[] {
  const actions = <T extends { id: string; status: RecordStatus }>(name: (row: T) => string): Column<T> => ({
    key: 'actions',
    header: 'Actions',
    align: 'center',
    className: 'w-[80px]',
    cell: (row) => <RowActions kind={kind} id={row.id} name={name(row)} status={row.status} />,
  })
  if (kind === 'forums')
    return [
      {
        key: 'name',
        header: 'Forum Name',
        cell: (row) => (
          <span className="flex max-w-[180px] items-center gap-1.5">
            <Avatar src={row.avatarUrl} name={row.name} size={20} />
            <span className="truncate">{row.name}</span>
          </span>
        ),
      },
      { key: 'id', header: 'Forum Id', cell: (row) => row.id },
      { key: 'creator', header: 'Creator / Moderator', cell: (row) => row.creator },
      { key: 'members', header: 'Members', cell: (row) => compact.format(row.members).toLowerCase() },
      { key: 'reports', header: 'Reports', cell: (row) => count(row.reports) },
      {
        key: 'created',
        header: 'Date created',
        cell: (row) => <span className="whitespace-nowrap">{stamp(row.createdAt)}</span>,
      },
      { key: 'status', header: 'Status', align: 'center', cell: status },
      actions<AdminForumRow>((row) => row.name),
    ] satisfies Column<AdminForumRow>[]
  return [
    { key: 'name', header: 'Project', cell: (row) => <span className="block max-w-[160px] truncate">{row.name}</span> },
    { key: 'id', header: 'Project Id', cell: (row) => row.id },
    { key: 'creator', header: 'Creator', cell: (row) => row.creator },
    { key: 'members', header: 'Members', cell: (row) => row.members },
    { key: 'reports', header: 'Reports', cell: (row) => count(row.reports) },
    {
      key: 'created',
      header: 'Date created',
      cell: (row) => <span className="whitespace-nowrap">{stamp(row.createdAt)}</span>,
    },
    { key: 'status', header: 'Status', align: 'center', cell: status },
    actions<AdminProjectRow>((row) => row.name),
  ] satisfies Column<AdminProjectRow>[]
}

/** The page search (top bar) and the table search share one value. */
function RecordsPanel({
  kind,
  search,
  query,
  onSearch,
  page,
  onPage,
}: {
  kind: Kind
  search: string
  query: string
  onSearch: (value: string) => void
  page: number
  onPage: (page: number) => void
}) {
  const config = CONFIG[kind]
  const records = useRecords(kind, { page, search: query })

  return (
    <Panel className="py-[3px]">
      <PanelHeader
        title={config.tableTitle}
        className="border-b border-hairline [&_h2]:text-body-m"
        action={<TableSearch value={search} onChange={onSearch} placeholder={config.searchLabel} />}
      />
      {records.isError ? (
        <ErrorState message={getErrorMessage(records.error)} onRetry={() => records.refetch()} />
      ) : (
        <>
          <DataTable
            columns={columnsFor(kind) as Column<AdminForumRow | AdminProjectRow>[]}
            rows={records.data?.items}
            rowKey={(row) => row.id}
            loading={records.isFetching}
            headerTint={false}
            empty="No results match your search."
          />
          {records.data && (
            <Pagination
              page={records.data.page}
              pageSize={records.data.pageSize}
              total={records.data.total}
              shown={records.data.items.length}
              onPage={onPage}
            />
          )}
        </>
      )}
    </Panel>
  )
}
