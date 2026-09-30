import { Bell, GearSix, SignOut, User, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ConfirmDialog, Menu, MenuItem, ReportDialog, useToast } from '@/components/ui'
import { REPORT_REASONS } from '@/features/feed/types'
import { getErrorMessage } from '@/lib/api/client'
import { useLeaveProject, useReportProject } from '../hooks/queries'
import type { ProjectWorkspace } from '../types'
import { ProjectMembersModal } from './ProjectMembersModal'
import { ProjectNotificationsModal } from './ProjectNotificationsModal'

type Dialog = 'notifications' | 'members' | 'report' | 'leave'

/** "Project settings" button and its menu (Figma "Project Settings"), plus the dialogs it opens. */
export function ProjectSettingsMenu({ workspace }: { workspace: ProjectWorkspace }) {
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const navigate = useNavigate()
  const toast = useToast()
  const leave = useLeaveProject(workspace.id)
  const report = useReportProject(workspace.id)
  const isAdmin = workspace.membership === 'admin'
  const close = () => setDialog(null)

  return (
    <>
      <Menu
        title="Project Settings"
        className="w-[239px] [&>p:first-child]:text-fg"
        trigger={
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-sm border border-grey-30 p-2.5 text-body-s text-grey-40 transition hover:bg-fg/[0.03] dark:border-fg dark:text-fg"
          >
            <GearSix aria-hidden className="size-[18px]" />
            <span className="hidden sm:inline">Project settings</span>
            <span className="sr-only sm:hidden">Project settings</span>
          </button>
        }
      >
        {(closeMenu) => {
          const open = (next: Dialog) => () => {
            closeMenu()
            setDialog(next)
          }
          return (
            <>
              <MenuItem iconAfter size="sm" icon={<Bell />} onSelect={open('notifications')}>
                Notifications
              </MenuItem>
              {isAdmin && (
                <MenuItem
                  iconAfter
                  size="sm"
                  icon={<GearSix />}
                  onSelect={() => {
                    closeMenu()
                    navigate(paths.editProject(workspace.id))
                  }}
                >
                  Edit Project Details
                </MenuItem>
              )}
              <MenuItem iconAfter size="sm" icon={<User />} onSelect={open('members')}>
                Project Members
              </MenuItem>
              <MenuItem iconAfter size="sm" tone="warning" icon={<Warning />} onSelect={open('report')}>
                Report this project
              </MenuItem>
              <MenuItem iconAfter size="sm" tone="danger" icon={<SignOut />} onSelect={open('leave')}>
                Leave Project
              </MenuItem>
            </>
          )
        }}
      </Menu>

      {dialog === 'notifications' && <ProjectNotificationsModal projectId={workspace.id} onClose={close} />}
      {dialog === 'members' && <ProjectMembersModal workspace={workspace} onClose={close} />}

      <ReportDialog
        open={dialog === 'report'}
        onClose={() => {
          report.reset()
          close()
        }}
        title="Report Project"
        prompt="What’s wrong with this project? Choose the most relevant reason."
        reasons={REPORT_REASONS}
        submitLabel="Report this Project"
        loading={report.isPending}
        error={report.isError ? getErrorMessage(report.error) : undefined}
        onSubmit={(reasons) =>
          report.mutate(reasons, {
            onSuccess: () => {
              toast('Thanks — our moderators will review this project')
              close()
            },
          })
        }
      />

      <ConfirmDialog
        open={dialog === 'leave'}
        title="Leave project?"
        message={`You’ll lose access to ${workspace.title}’s research, prototypes and chat. Confidentiality obligations still apply after you leave.`}
        confirmLabel="Leave Project"
        loading={leave.isPending}
        onClose={close}
        onConfirm={() =>
          leave.mutate(undefined, {
            onSuccess: () => {
              toast(`You left ${workspace.title}`)
              navigate(paths.projects)
            },
            onError: (error) => toast(getErrorMessage(error)),
          })
        }
      />
    </>
  )
}
