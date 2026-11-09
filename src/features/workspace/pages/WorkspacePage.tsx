import { Link, Navigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Button, Spinner } from '@/components/ui'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import { ApiError, getErrorMessage } from '@/lib/api/errors'
import { ContractTab } from '../components/ContractTab'
import { ExpertTab } from '../components/ExpertTab'
import { LedgerTab } from '../components/LedgerTab'
import { OverviewTab } from '../components/OverviewTab'
import { ProjectSettingsMenu } from '../components/ProjectSettingsMenu'
import { PrototypeTab } from '../components/PrototypeTab'
import { PrototypeVersions } from '../components/PrototypeVersions'
import { ResearchTab } from '../components/ResearchTab'
import { TasksTab } from '../components/TasksTab'
import { WorkspaceTabBar } from '../components/WorkspaceTabBar'
import { useWorkspace } from '../hooks/queries'
import { WORKSPACE_TABS, type ProjectWorkspace, type WorkspaceTab } from '../types'

const isTab = (value: string | undefined): value is WorkspaceTab => WORKSPACE_TABS.some((tab) => tab.value === value)

/** Project workspace (Figma WORKSPACE page): header, section tabs and the active section. */
export function WorkspacePage() {
  const { projectId = '', tab: tabParam, prototypeId } = useParams()
  const workspace = useWorkspace(projectId)
  const tab: WorkspaceTab = prototypeId ? 'prototype' : isTab(tabParam) ? tabParam : 'overview'

  if (tabParam && !isTab(tabParam)) return <Navigate to={paths.project(projectId)} replace />

  return (
    <>
      <SearchHeader searchClassName="max-w-[668px]" />
      <div className="flex flex-col gap-gap-md px-4 pt-[26px] pb-10 sm:px-5 lg:px-[17px] xl:pr-[57px]">
        {workspace.isPending ? (
          <div className="flex justify-center py-24 text-brand-orange">
            <Spinner />
          </div>
        ) : workspace.isError ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-body-m text-fg-muted">
              {workspace.error instanceof ApiError && workspace.error.status === 404
                ? 'We couldn’t find that project.'
                : getErrorMessage(workspace.error)}
            </p>
            <Button
              variant="outline"
              fullWidth={false}
              className="h-10 rounded-full text-body-m"
              onClick={() => workspace.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <Workspace workspace={workspace.data} tab={tab} prototypeId={prototypeId} />
        )}
      </div>
    </>
  )
}

function Workspace({
  workspace,
  tab,
  prototypeId,
}: {
  workspace: ProjectWorkspace
  tab: WorkspaceTab
  prototypeId?: string
}) {
  const isMember = workspace.membership === 'member' || workspace.membership === 'admin'

  // Sections other than the overview are for members only.
  if (!isMember && tab !== 'overview') return <Navigate to={paths.project(workspace.id)} replace />

  return (
    <>
      <div className="flex flex-col gap-[33px]">
        <div className="flex items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="min-w-0 truncate text-body-m text-grey-40 dark:text-fg-body">
            <Link to={paths.projects} className="hover:underline">
              Projects
            </Link>
            <span aria-hidden> &gt; </span>
            <span aria-current="page" className="text-fg">
              {workspace.title}
            </span>
          </nav>
          {isMember && <ProjectSettingsMenu workspace={workspace} />}
        </div>
        <WorkspaceTabBar projectId={workspace.id} active={tab} locked={!isMember} />
      </div>

      {tab === 'overview' && <OverviewTab workspace={workspace} />}
      {tab === 'research' && <ResearchTab projectId={workspace.id} isAdmin={workspace.membership === 'admin'} />}
      {tab === 'prototype' &&
        (prototypeId ? (
          <PrototypeVersions projectId={workspace.id} prototypeId={prototypeId} />
        ) : (
          <PrototypeTab projectId={workspace.id} isAdmin={workspace.membership === 'admin'} />
        ))}
      {tab === 'expert' && <ExpertTab projectId={workspace.id} />}
      {tab === 'ledger' && <LedgerTab projectId={workspace.id} />}
      {tab === 'contract' && <ContractTab projectId={workspace.id} />}
      {tab === 'tasks' && <TasksTab projectId={workspace.id} canCreate={workspace.membership === 'admin'} />}
    </>
  )
}
