import { ArrowDown, Check, DotsThree, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { AvatarStack, IconButton, Menu, MenuItem, MenuRadioItem, Spinner, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import { formatDue } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useDeleteTask, useTasks, useToggleTask } from '../hooks/queries'
import type { ProjectTask } from '../types'
import { CreateTaskModal } from './CreateTaskModal'
import { TabState, WorkspaceAction } from './shared'

type Sort = 'due' | 'open-first'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'due', label: 'Due date' },
  { value: 'open-first', label: 'Open tasks first' },
]

const sorters: Record<Sort, (a: ProjectTask, b: ProjectTask) => number> = {
  due: (a, b) => a.dueDate.localeCompare(b.dueDate),
  'open-first': (a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate),
}

/** Project task list (Figma "Tasks"); admins can create tasks. */
export function TasksTab({ projectId, canCreate }: { projectId: string; canCreate: boolean }) {
  const tasks = useTasks(projectId)
  const [sort, setSort] = useState<Sort>('open-first')
  const [creating, setCreating] = useState(false)

  return (
    <div className="flex flex-col gap-gap-sm">
      {canCreate && <WorkspaceAction onClick={() => setCreating(true)}>New Task</WorkspaceAction>}

      <div className="flex flex-col gap-[23px] pt-2 lg:px-[107px]">
        <Menu
          align="start"
          title="Sort by"
          trigger={
            <button
              type="button"
              className="flex items-center gap-1 self-start text-body-s text-grey-40 hover:text-fg dark:text-fg-body"
            >
              Sort by
              <ArrowDown aria-hidden className="size-[18px]" />
            </button>
          }
        >
          {(close) =>
            SORTS.map((option) => (
              <MenuRadioItem
                key={option.value}
                checked={sort === option.value}
                onSelect={() => {
                  setSort(option.value)
                  close()
                }}
              >
                {option.label}
              </MenuRadioItem>
            ))
          }
        </Menu>

        {tasks.isPending ? (
          <TabState>
            <Spinner className="text-brand-orange" />
          </TabState>
        ) : tasks.isError ? (
          <TabState>{getErrorMessage(tasks.error)}</TabState>
        ) : tasks.data.length === 0 ? (
          <TabState>No tasks yet.</TabState>
        ) : (
          <ul className="flex flex-col gap-3">
            {[...tasks.data].sort(sorters[sort]).map((task) => (
              <TaskCard key={task.id} projectId={projectId} task={task} />
            ))}
          </ul>
        )}
      </div>

      {creating && <CreateTaskModal projectId={projectId} onClose={() => setCreating(false)} />}
    </div>
  )
}

function TaskCard({ projectId, task }: { projectId: string; task: ProjectTask }) {
  const toggle = useToggleTask(projectId)
  const remove = useDeleteTask(projectId)
  const toast = useToast()
  const onError = (error: unknown) => toast(getErrorMessage(error))
  const setCompleted = (completed: boolean) => toggle.mutate({ taskId: task.id, completed }, { onError })

  return (
    <li className="flex flex-col overflow-hidden rounded-card bg-surface-raised px-3 shadow-card">
      <div className="flex items-center gap-2 border-b border-grey-30 py-2 dark:border-hairline">
        <div className={cn('flex min-w-0 flex-1 flex-col gap-1', task.completed && 'text-grey-40')}>
          <h3 className={cn('text-body-s', task.completed ? 'line-through' : 'text-fg')}>{task.title}</h3>
          <p className="max-w-[440px] text-caption text-grey-40 dark:text-fg-body">{task.description}</p>
        </div>
        <label className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-fg/5">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={task.completed}
            onChange={(event) => setCompleted(event.target.checked)}
            aria-label={`Mark “${task.title}” as ${task.completed ? 'not done' : 'done'}`}
          />
          <span
            aria-hidden
            className={cn(
              'flex size-[18px] items-center justify-center rounded-[2px] transition-colors',
              'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-green',
              task.completed ? 'bg-brand-orange text-white' : 'border border-grey-30',
            )}
          >
            {task.completed && <Check weight="bold" className="size-3" />}
          </span>
        </label>
      </div>
      <div className="flex items-center justify-between gap-3 py-2">
        <p className="text-caption text-grey-40 dark:text-fg-body">
          {task.completed ? 'Completed' : formatDue(task.dueDate)}
        </p>
        <div className="flex items-center gap-2">
          <AvatarStack people={task.assignees} size={24} />
          <Menu
            trigger={
              <IconButton label={`Actions for “${task.title}”`} className="size-6 text-fg">
                <DotsThree weight="bold" className="size-[17px]" />
              </IconButton>
            }
            className="w-[220px]"
          >
            {(close) => (
              <>
                <MenuItem
                  size="sm"
                  icon={<Check />}
                  onSelect={() => {
                    close()
                    setCompleted(!task.completed)
                  }}
                >
                  {task.completed ? 'Mark as not done' : 'Mark as done'}
                </MenuItem>
                <MenuItem
                  size="sm"
                  tone="danger"
                  icon={<Trash />}
                  onSelect={() => {
                    close()
                    remove.mutate(task.id, { onSuccess: () => toast('Task deleted'), onError })
                  }}
                >
                  Delete task
                </MenuItem>
              </>
            )}
          </Menu>
        </div>
      </div>
    </li>
  )
}
