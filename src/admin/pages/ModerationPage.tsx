import { useDeferredValue, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { adminPaths } from '../paths'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { AdminTopBar } from '../components/AdminTopBar'
import { QueueTable } from '../components/ReportTables'
import { ReviewPanel } from '../components/ReviewPanel'
import { ErrorState } from '../components/states'
import { AdminContent, Breadcrumb, Pagination, Panel, PanelHeader } from '../components/ui'
import { useReports } from '../hooks/queries'
import type { AdminReport } from '@/lib/api'
import { MODERATION_SECTIONS, type ModerationSection, type ReportFilter } from '../types'

const FILTERS: { value: ReportFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'dismissed', label: 'Dismissed' },
]

const SECTION: Record<ModerationSection, { title: string; to: string }> = {
  overview: { title: 'Overview', to: adminPaths.overview },
  users: { title: 'Users', to: adminPaths.users },
  forums: { title: 'Forums', to: adminPaths.forums },
  projects: { title: 'Projects', to: adminPaths.projects },
}

const isSection = (value: string | undefined): value is ModerationSection =>
  MODERATION_SECTIONS.includes(value as ModerationSection)

/** Full moderation queue with the review panel (Figma "moderation view" / "…side bar"). */
export function ModerationPage() {
  const { section } = useParams()
  if (!isSection(section)) return <Navigate to={adminPaths.moderation('overview')} replace />
  // Remount per section so filters and the open review reset.
  return <ModerationQueue key={section} section={section} />
}

function ModerationQueue({ section }: { section: ModerationSection }) {
  const [filter, setFilter] = useState<ReportFilter>('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [reviewing, setReviewing] = useState<AdminReport | null>(null)
  const query = useDeferredValue(search.trim())
  const reports = useReports(section, { status: filter, page, pageSize: 15, q: query || undefined })
  const { title, to } = SECTION[section]

  // Keep the open review in sync after an action refreshes the queue.
  const current = reviewing ? (reports.data?.data.find((item) => item.id === reviewing.id) ?? reviewing) : null

  return (
    <div className="flex">
      <div className="min-w-0 flex-1">
        <AdminTopBar
          title={title}
          searchPlaceholder="Search reports"
          search={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />
        <AdminContent className="gap-gap-sm">
          <Breadcrumb items={[{ label: title, to }, { label: 'Moderation queue' }]} />
          <div role="group" aria-label="Filter reports" className="flex flex-wrap gap-[15px] pt-6 pb-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => {
                  setFilter(item.value)
                  setPage(1)
                }}
                className={cn(
                  'min-w-[74px] rounded-full p-2.5 text-body-m transition-colors',
                  filter === item.value
                    ? 'bg-brand-orange font-semibold text-white'
                    : 'border border-hairline bg-surface-raised text-fg hover:border-grey-40',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Panel className="py-[3px]">
            <PanelHeader title="Moderation Queue" className="px-[17px] [&_h2]:text-body-l" />
            {reports.isError ? (
              <ErrorState message={getErrorMessage(reports.error)} onRetry={() => reports.refetch()} />
            ) : (
              <>
                <QueueTable
                  section={section}
                  reports={reports.data?.data}
                  loading={reports.isFetching}
                  selectedId={current?.id}
                  onReview={setReviewing}
                />
                {reports.data && (
                  <Pagination
                    page={reports.data.page}
                    pageSize={reports.data.pageSize}
                    total={reports.data.total}
                    shown={reports.data.data.length}
                    onPage={setPage}
                  />
                )}
              </>
            )}
          </Panel>
        </AdminContent>
      </div>
      {current && <ReviewPanel report={current} onClose={() => setReviewing(null)} />}
    </div>
  )
}
