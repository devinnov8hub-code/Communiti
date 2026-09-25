import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Tag } from '@/components/ui'
import { createdLabel } from '../format'
import type { Forum } from '../types'

/** Forum summary card (Figma "Forum card web"). */
export function ForumCard({ forum }: { forum: Forum }) {
  return (
    <Link to={paths.forum(forum.id)} className="group flex flex-col gap-[0.4px] py-[3px]">
      <div className="h-[200px] overflow-hidden rounded-t-card bg-grey-30 sm:h-[282px]">
        {forum.coverUrl && (
          <img
            src={forum.coverUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="flex flex-col gap-3 border-b border-hairline bg-background p-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-h4 font-semibold text-fg group-hover:underline">{forum.name}</h2>
          <p className="text-body-s text-fg-muted">{createdLabel(forum.createdAt)}</p>
        </div>
        <ul className="flex flex-wrap gap-x-[17px] gap-y-2">
          {forum.topics.map((topic) => (
            <li key={topic.label}>
              <Tag tone={topic.tone} className="text-caption">
                {topic.label}
              </Tag>
            </li>
          ))}
        </ul>
        <p className="text-body-m text-fg">{forum.description}</p>
      </div>
    </Link>
  )
}
