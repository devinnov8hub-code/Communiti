import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AvatarStack, Tag, type TagTone } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Project, ProjectStatus } from '../types'

// "Open" uses System/Green/40 text (topic tags use the darker Green/50).
const STATUS: Record<ProjectStatus, { label: string; tone: TagTone; className?: string }> = {
  open: { label: 'Open', tone: 'success', className: 'text-success' },
  'in-progress': { label: 'In progress', tone: 'info' },
  closed: { label: 'Closed', tone: 'warning' },
}

/** Project summary card (Figma "Project"). */
export function ProjectCard({ project }: { project: Project }) {
  const status = STATUS[project.status]
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
            <p className="text-body-m text-fg-muted sm:text-body-l">By {project.owner.name}</p>
          </div>
          <Tag tone={status.tone} className={cn('min-w-[103px] text-body-m', status.className)}>
            {status.label}
          </Tag>
        </div>

        {project.tags.length > 0 && (
          <ul className="flex flex-wrap gap-x-[17px] gap-y-2">
            {project.tags.map((tag) => (
              <li key={tag.label}>
                <Tag tone={tag.tone} className="text-body-m sm:text-body-l">
                  {tag.label}
                </Tag>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-body-m text-fg sm:text-body-l">{project.description}</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AvatarStack people={project.members} />
          <span className="text-body-m text-fg-subtle">{project.membersCount} members</span>
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
