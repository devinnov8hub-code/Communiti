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

/** Admin activity log (Figma "Admin logs"). */
export function LogsTable({ logs, loading }: { logs: AdminLog[] | undefined; loading?: boolean }) {
  return <DataTable columns={columns} rows={logs} rowKey={(row) => row.id} loading={loading} empty="No log entries." />
}
