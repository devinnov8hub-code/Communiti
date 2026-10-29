import type { AdminListAuditLogsResponse } from '@/lib/api'
import { DataTable, type Column } from './ui'

const stamp = (iso: string) => iso.replace('T', ' ').slice(0, 19)

/** One audit-log entry as the backend returns it. */
export type AuditLogEntry = AdminListAuditLogsResponse['data'][number]

const columns: Column<AuditLogEntry>[] = [
  { key: 'action', header: 'Action', cell: (row) => row.label },
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
  { key: 'message', header: 'Log Message', cell: (row) => row.details },
]

const ipColumn: Column<AuditLogEntry> = {
  key: 'ip',
  header: 'Ip',
  align: 'center',
  cell: (row) => row.ip ?? '—',
}

/** Admin audit log (Figma "Admin logs"). The Logs page adds the IP column. */
export function AuditLogTable({
  entries,
  loading,
  showIp,
}: {
  entries: AuditLogEntry[] | undefined
  loading?: boolean
  showIp?: boolean
}) {
  return (
    <DataTable
      columns={showIp ? [...columns, ipColumn] : columns}
      rows={entries}
      rowKey={(row) => row.id}
      loading={loading}
      empty="No log entries."
    />
  )
}
