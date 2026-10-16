import type { AdminListAuditLogsResponse } from '@/lib/api'
import { titleCase } from '@/lib/format'
import type { AdminLog } from '../types'
import { DataTable, type Column } from './ui'

const stamp = (iso: string) => iso.replace('T', ' ').slice(0, 19)

const columns: Column<AdminLog>[] = [
  { key: 'action', header: 'Action', cell: (row) => row.action },
  {
    key: 'at',
    header: 'Timestamp',
    align: 'center',
    cell: (row) => (
      <time dateTime={row.at} className="whitespace-nowrap text-fg-muted">
        {stamp(row.at)}
      </time>
    ),
  },
  { key: 'message', header: 'Log Message', cell: (row) => row.message },
]

/** One audit-log entry as the backend returns it. */
export type AuditLogEntry = AdminListAuditLogsResponse['data'][number]

const auditColumns: Column<AuditLogEntry>[] = [
  // "user.suspend" → "User suspend"
  { key: 'action', header: 'Action', cell: (row) => titleCase(row.action.replace(/[._]/g, ' ')) },
  {
    key: 'at',
    header: 'Timestamp',
    align: 'center',
    cell: (row) => (
      <time dateTime={row.createdAt} className="whitespace-nowrap text-fg-muted">
        {stamp(row.createdAt)}
      </time>
    ),
  },
  {
    key: 'message',
    header: 'Log Message',
    cell: (row) => row.message ?? (row.actor ? `By ${row.actor.fullName}` : '—'),
  },
]

/** Admin audit log (Figma "Admin logs"), straight from the backend. */
export function AuditLogTable({ entries, loading }: { entries: AuditLogEntry[] | undefined; loading?: boolean }) {
  return (
    <DataTable
      columns={auditColumns}
      rows={entries}
      rowKey={(row) => row.id}
      loading={loading}
      empty="No log entries."
    />
  )
}

/** Logs page table (sample data). Removed once the Logs page uses AuditLogTable. */
export function LogsTable({ logs, loading }: { logs: AdminLog[] | undefined; loading?: boolean }) {
  return <DataTable columns={columns} rows={logs} rowKey={(row) => row.id} loading={loading} empty="No log entries." />
}
