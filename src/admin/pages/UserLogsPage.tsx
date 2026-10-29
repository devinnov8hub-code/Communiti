import { CalendarDots } from '@phosphor-icons/react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, DateField } from '@/components/ui'
import type { AdminListUserLogsResponse } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { ErrorState } from '../components/states'
import { AdminContent, Breadcrumb, DataTable, Pagination, Panel, PanelHeader, type Column } from '../components/ui'
import { useAdminUser, useUserLogs } from '../hooks/queries'
import { adminPaths } from '../paths'

type LogEntry = AdminListUserLogsResponse['data'][number]

const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const columns: Column<LogEntry>[] = [
  { key: 'action', header: 'Action', cell: (row) => row.label },
  { key: 'details', header: 'Details', cell: (row) => row.details },
  {
    key: 'date',
    header: 'Date',
    cell: (row) => (
      <time dateTime={row.createdAt} className="whitespace-nowrap">
        {day.format(new Date(row.createdAt))}
      </time>
    ),
  },
  { key: 'location', header: 'Location', cell: (row) => row.location ?? '—' },
]

/** One member's account logs (Figma "user logs"). */
export function UserLogsPage() {
  const { userId = '' } = useParams()
  const user = useAdminUser(userId)
  const [page, setPage] = useState(1)
  const [range, setRange] = useState({ from: '', to: '' })
  const [filtering, setFiltering] = useState(false)
  const logs = useUserLogs(userId, {
    page,
    pageSize: 15,
    from: range.from || undefined,
    to: range.to || undefined,
  })

  const setDate = (key: 'from' | 'to', value: string) => {
    setRange((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  return (
    <>
      <AdminTopBar title="Users" />
      <AdminContent className="gap-gap-lg">
        <Breadcrumb
          items={[
            { label: 'Users', to: adminPaths.users },
            { label: user.data?.fullName ?? '…' },
            { label: 'Account logs' },
          ]}
        />
        <Panel className="py-[3px]">
          <PanelHeader
            title="All Account logs"
            className="[&_h2]:text-body-m"
            action={
              <Button
                variant="outline"
                fullWidth={false}
                aria-expanded={filtering}
                onClick={() => setFiltering((open) => !open)}
                className="h-[38px] gap-2 rounded-control px-4 text-body-s"
              >
                <CalendarDots aria-hidden className="size-5 text-brand-orange" />
                Filter by date
              </Button>
            }
          />
          {filtering && (
            <div className="flex flex-wrap items-end gap-3 px-[17px] pb-3">
              <DateField
                label="From"
                placeholder="First day"
                value={range.from}
                max={range.to || undefined}
                onChange={(event) => setDate('from', event.target.value)}
                className="w-[180px]"
              />
              <DateField
                label="To"
                placeholder="Last day"
                value={range.to}
                min={range.from || undefined}
                onChange={(event) => setDate('to', event.target.value)}
                className="w-[180px]"
              />
              {(range.from || range.to) && (
                <Button
                  variant="outline"
                  fullWidth={false}
                  onClick={() => {
                    setRange({ from: '', to: '' })
                    setPage(1)
                  }}
                  className="h-control rounded-control px-4 text-body-s"
                >
                  Clear
                </Button>
              )}
            </div>
          )}
          {logs.isError ? (
            <ErrorState message={getErrorMessage(logs.error)} onRetry={() => logs.refetch()} />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={logs.data?.data}
                rowKey={(row) => row.id}
                loading={logs.isFetching}
                empty={range.from || range.to ? 'No activity in these dates.' : 'No account activity yet.'}
              />
              {logs.data && (
                <Pagination
                  page={logs.data.page}
                  pageSize={logs.data.pageSize}
                  total={logs.data.total}
                  shown={logs.data.data.length}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </Panel>
      </AdminContent>
    </>
  )
}
