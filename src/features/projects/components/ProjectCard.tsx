import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AvatarStack, Tag, type TagTone } from '@/components/ui'
import { topicTone } from '@/features/forums/format'
import type { ProjectCard as ProjectSummary } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { ProjectStatus } from '../types'

// "Open" uses System/Green/40 text (topic tags use the darker Green/50).
const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: TagTone; className?: string }> = {
  open: { label: 'Open', tone: 'success', className: 'text-success' },
  ongoing: { label: 'Ongoing', tone: 'warning' },
  completed: { label: 'Completed', tone: 'info' },
  archived: { label: 'Archived', tone: 'info' },
}

/** Project summary card (Figma "Project"). */
export function ProjectCard({ project }: { project: ProjectSummary }) {
  const status = PROJECT_STATUS[project.status]
  const href = paths.project(project.id)

  return (
    <article className="flex flex-col gap-gap-sm border-b border-hairline bg-background px-4 py-2.5 sm:px-5">
      <div className="flex flex-col gap-3">
        <Link to={href} tabIndex={-1} aria-hidden className="block h-[200px] bg-grey-30 sm:h-[300px]">
          {project.coverUrl && <img src={project.coverUrl} alt="" loading="lazy" className="size-full object-cover" />}
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <h2 className="text-body-l font-semibold text-fg sm:text-h3">
              <Link to={href} className="hover:underline">
                {project.title}
              </Link>
            </h2>
            <p className="text-body-m text-fg-muted sm:text-body-l">By {project.owner.fullName}</p>
          </div>
          <Tag tone={status.tone} className={cn('min-w-[103px] text-body-m', status.className)}>
            {status.label}
          </Tag>
        </div>

        {project.topics.length > 0 && (
          <ul className="flex flex-wrap gap-x-[17px] gap-y-2">
            {project.topics.map((topic, index) => (
              <li key={topic.id}>
                <Tag tone={topicTone(index)} className="text-body-m sm:text-body-l">
                  {topic.name}
                </Tag>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-body-m text-fg sm:text-body-l">{project.pitch}</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AvatarStack
            people={project.memberAvatars.map((member) => ({
              id: member.id,
              name: member.fullName,
              avatarUrl: member.avatarUrl ?? undefined,
            }))}
          />
          <span className="text-body-m text-fg-subtle">
            {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
        <Link
          to={href}
          className="flex h-[38px] w-full items-center justify-center gap-1 rounded-full bg-brand-orange px-2 py-[5px] text-body-l text-white transition hover:brightness-95 sm:w-[204px]"
        >
          View Project
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </article>
  )
}
