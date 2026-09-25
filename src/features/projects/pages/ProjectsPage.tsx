import { useState } from 'react'
import { PageColumns } from '@/components/layout/AppShell'
import { Button, EmptyState, Tabs } from '@/components/ui'
import { RightRail } from '@/features/feed/components/RightRail'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import { getErrorMessage } from '@/lib/api/client'
import { ProjectCard } from '../components/ProjectCard'
import { useProjects } from '../hooks/queries'
import type { ProjectsTab } from '../types'

const TABS = [
  { value: 'all', label: 'Projects' },
  { value: 'mine', label: 'My Projects' },
] as const

/** Projects list (Figma "Projects view"). */
export function ProjectsPage() {
  const [tab, setTab] = useState<ProjectsTab>('all')
  const projects = useProjects(tab)

  return (
    <PageColumns aside={<RightRail />}>
      <SearchHeader>
        <Tabs label="Projects" items={TABS} value={tab} onChange={setTab} />
      </SearchHeader>

      <div className="flex flex-col gap-3 sm:p-2.5">
        {projects.isPending ? (
          Array.from({ length: 2 }, (_, index) => (
            <div key={index} aria-hidden className="flex animate-pulse flex-col gap-3 px-5 py-2.5">
              <div className="h-[300px] bg-surface dark:bg-grey-50" />
              <div className="h-6 w-1/2 rounded bg-surface dark:bg-grey-50" />
              <div className="h-4 w-1/3 rounded bg-surface dark:bg-grey-50" />
            </div>
          ))
        ) : projects.isError ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-body-m text-fg-muted">{getErrorMessage(projects.error)}</p>
            <Button
              variant="outline"
              fullWidth={false}
              className="h-10 rounded-full text-body-m"
              onClick={() => projects.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : projects.data.length === 0 ? (
          <EmptyState
            title={tab === 'mine' ? 'No projects yet' : 'No projects found'}
            description={
              tab === 'mine' ? 'Projects you create or join will appear here.' : 'Check back soon for new projects.'
            }
          />
        ) : (
          projects.data.map((project) => <ProjectCard key={project.id} project={project} />)
        )}
      </div>
    </PageColumns>
  )
}
