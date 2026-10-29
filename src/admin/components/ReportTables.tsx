import type { AdminReport } from '@/lib/api'
import { titleCase } from '@/lib/format'
import { reasonLabel, reportPill, reportSubject } from '../reports'
import type { ModerationSection } from '../types'
import { DataTable, ReportStatusPill, type Column } from './ui'

const REASON_TONE: Record<string, string> = { Spam: 'text-warning', Insults: 'text-fg-muted' }

const nameHeader: Record<ModerationSection, string> = {
  overview: 'Name / Title',
  users: 'Username',
  forums: 'Forum Name',
  projects: 'Project Name',
}

/** Dashboard "Moderation Queue" card: the newest pending reports. */
export function PendingReportsTable({
  reports,
  loading,
  nameHeader = 'UserName',
  showType = true,
}: {
  reports: AdminReport[] | undefined
  loading?: boolean
  nameHeader?: string
  /** Hide on screens where every report is the same kind (e.g. Users). */
  showType?: boolean
}) {
  const columns: Column<AdminReport>[] = [
    {
      key: 'name',
      header: nameHeader,
      cell: (row) => <span className="block max-w-[180px] truncate">{reportSubject(row)}</span>,
    },
    ...(showType
      ? [
          {
            key: 'type',
            header: 'Type',
            align: 'center' as const,
            cell: (row: AdminReport) => titleCase(row.targetType),
          },
        ]
      : []),
    {
      key: 'reason',
      header: 'Reason',
      align: 'center',
      cell: (row) => (
        <span className={REASON_TONE[reasonLabel(row.reason)] ?? 'text-fg'}>{reasonLabel(row.reason)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) => <ReportStatusPill status={reportPill(row)} size="xs" />,
    },
  ]
  return <DataTable columns={columns} rows={reports} rowKey={(row) => row.id} loading={loading} empty="No reports 🎉" />
}

/** Full moderation queue with a Review action per row (Figma "moderation view"). */
export function QueueTable({
  section,
  reports,
  loading,
  selectedId,
  onReview,
}: {
  section: ModerationSection
  reports: AdminReport[] | undefined
  loading?: boolean
  selectedId?: string
  onReview: (report: AdminReport) => void
}) {
  const columns: Column<AdminReport>[] = [
    {
      key: 'name',
      header: nameHeader[section],
      cell: (row) => <span className="block max-w-[220px] truncate">{reportSubject(row)}</span>,
    },
    ...(section === 'overview'
      ? [
          {
            key: 'type',
            header: 'Type',
            align: 'center' as const,
            cell: (row: AdminReport) => titleCase(row.targetType),
          },
        ]
      : []),
    {
      key: 'reason',
      header: 'Reason',
      className: section === 'overview' ? undefined : 'text-caption',
      cell: (row) => reasonLabel(row.reason),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) => <ReportStatusPill status={reportPill(row)} size={section === 'overview' ? 'xs' : 'sm'} />,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      className: 'w-[90px]',
      cell: (row) => (
        <button
          type="button"
          onClick={() => onReview(row)}
          aria-pressed={row.id === selectedId}
          className="rounded-sm border border-hairline bg-offwhite px-2 py-1 text-xs text-fg shadow-sm hover:bg-grey-30/50 aria-pressed:border-brand-orange aria-pressed:text-brand-orange dark:bg-grey-50"
        >
          Review
        </button>
      ),
    },
  ]
  return (
    <DataTable
      columns={columns}
      rows={reports}
      rowKey={(row) => row.id}
      loading={loading}
      empty="No reports match this filter."
    />
  )
}
