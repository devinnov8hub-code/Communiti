import { useDeferredValue, useState } from 'react'
import { getErrorMessage } from '@/lib/api/errors'
import { AdminTopBar } from '../components/AdminTopBar'
import { AuditLogTable } from '../components/LogsTable'
import { ErrorState } from '../components/states'
import { AdminContent, Pagination, Panel, PanelHeader } from '../components/ui'
import { useAuditLogs } from '../hooks/queries'

/** Full admin audit log (Figma "Admin Logs"). */
export function LogsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = useDeferredValue(search.trim())
  const logs = useAuditLogs({ page, pageSize: 15, q: query || undefined })

  return (
    <>
      <AdminTopBar
        title="Logs"
        searchPlaceholder="Search in Logs"
        search={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
      />
      <AdminContent className="lg:pt-[45px]">
        <Panel className="py-[3px]">
          <PanelHeader title="Admin logs" className="[&_h2]:text-body-m" />
          {logs.isError ? (
            <ErrorState message={getErrorMessage(logs.error)} onRetry={() => logs.refetch()} />
          ) : (
            <>
              <AuditLogTable entries={logs.data?.data} loading={logs.isFetching} showIp />
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
