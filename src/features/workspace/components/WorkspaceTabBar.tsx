import { NavLink } from 'react-router-dom'
import { paths } from '@/app/paths'
import { cn } from '@/lib/cn'
import { WORKSPACE_TABS, type WorkspaceTab } from '../types'

interface WorkspaceTabBarProps {
  projectId: string
  active: WorkspaceTab
  /** Non-members only see the Overview; the other tabs are greyed out. */
  locked: boolean
}

const tabClass = 'flex shrink-0 items-center justify-center border-b-3 px-2.5 py-2 text-body-m whitespace-nowrap'

/** Workspace section tabs (Figma "Tab bar"), one route per tab. Scrolls sideways on small screens. */
export function WorkspaceTabBar({ projectId, active, locked }: WorkspaceTabBarProps) {
  return (
    <nav
      aria-label="Project sections"
      className="[scrollbar-width:none] overflow-x-auto rounded-control border border-hairline bg-background px-2.5 pt-1.5 dark:border-border-default"
    >
      <ul className="flex min-w-max items-center gap-gap-sm px-2.5 pt-1 xl:justify-between">
        {WORKSPACE_TABS.map((tab) => {
          const isActive = tab.value === active
          const href = tab.value === 'overview' ? paths.project(projectId) : paths.projectTab(projectId, tab.value)
          return (
            <li key={tab.value} className="min-w-[96px] flex-1 xl:max-w-[130px]">
              {locked && tab.value !== 'overview' ? (
                <span
                  aria-disabled
                  title="Join the project to open this section"
                  className={cn(tabClass, 'cursor-not-allowed border-transparent text-grey-30 dark:text-grey-40/60')}
                >
                  {tab.label}
                </span>
              ) : (
                <NavLink
                  to={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    tabClass,
                    'transition-colors',
                    isActive
                      ? 'border-brand-orange text-brand-orange'
                      : 'border-transparent text-grey-40 hover:border-hairline dark:text-fg',
                  )}
                >
                  {tab.label}
                </NavLink>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
