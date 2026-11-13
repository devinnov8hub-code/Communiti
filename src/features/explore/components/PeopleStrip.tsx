import { Sparkle } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Avatar, VerifyTick } from '@/components/ui'
import { getRoleLabel } from '@/features/auth/user'
import { useProfilePath } from '@/features/profile/profilePath'
import { similarityReason, type SuggestedPerson } from '../similarity'

/** Horizontal "Suggested people" cards on the Explore tab; each opens the person's profile. */
export function PeopleStrip({ people }: { people: SuggestedPerson[] }) {
  const profilePath = useProfilePath()
  return (
    <ul className="-mx-2 flex snap-x [scrollbar-width:thin] gap-[15px] overflow-x-auto px-2 pb-1">
      {people.map((person) => (
        <li key={person.id} className="shrink-0 snap-start">
          <Link
            to={profilePath(person.id)}
            className="flex h-full w-[206px] flex-col items-center gap-2 rounded-card bg-surface px-3 py-2.5 text-center transition hover:ring-1 hover:ring-hairline"
          >
            <Avatar src={person.avatarUrl ?? undefined} name={person.fullName} size={58} />
            <span className="flex w-full flex-col gap-1">
              <span className="flex items-center justify-center gap-1 text-body-m text-fg">
                <span className="truncate">{person.fullName}</span>
                {person.verified && <VerifyTick active />}
              </span>
              <span className="truncate text-caption text-brand-orange">
                {getRoleLabel({ role: person.memberRole ?? undefined })}
              </span>
              {person.headline && <span className="truncate text-caption text-fg-muted">{person.headline}</span>}
            </span>
            <span className="text-caption text-grey-45 dark:text-grey-30">{similarityReason(person)}</span>
            {person.openToCollaborate && (
              <span className="mt-auto flex items-center gap-1 text-caption text-brand-green">
                <Sparkle aria-hidden className="size-4" />
                Open to collaborate
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
