import { CalendarDots, NavigationArrow } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar } from '@/components/ui'
import { formatDateRange } from '@/lib/format'
import { useEvents, useTrending } from '../hooks/queries'
import type { CommunityEvent, TrendingGroup } from '../types'

/** Right bar: trending forums/topics and upcoming events. */
export function RightRail() {
  const trending = useTrending()
  const events = useEvents()

  return (
    <div className="flex flex-col gap-gap-md">
      {trending.isPending
        ? Array.from({ length: 2 }, (_, index) => <CardSkeleton key={index} />)
        : trending.data?.map((group) => <TrendingCard key={group.id} group={group} />)}
      {events.isPending ? <CardSkeleton /> : events.data && <EventsCard events={events.data} />}
    </div>
  )
}

function RailCard({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-gap-md rounded-card border border-hairline px-5 py-2.5">
      <header className="flex items-center justify-between gap-3 text-body-l font-semibold">
        <h2 className="text-fg">{title}</h2>
        <Link to={href} className="shrink-0 text-brand-orange hover:underline">
          SEE ALL
        </Link>
      </header>
      {children}
    </section>
  )
}

function TrendingCard({ group }: { group: TrendingGroup }) {
  return (
    <RailCard title={group.title} href={group.href}>
      <ul className="flex flex-col gap-gap-md">
        {group.topics.map((topic) => (
          <li key={topic.id}>
            <Link to={group.href} className="group flex flex-col gap-gap-sm">
              <p className="text-body-m text-fg group-hover:underline">{topic.title}</p>
              <span className="flex items-center gap-[15px] text-body-m text-fg-muted">
                <Avatar src={topic.coverUrl} name={topic.title} size={36} />
                {topic.postsCount} Posts
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </RailCard>
  )
}

function EventsCard({ events }: { events: CommunityEvent[] }) {
  return (
    <RailCard title="Events" href={paths.events}>
      <ul className="flex flex-col gap-gap-md">
        {events.map((event) => (
          <li key={event.id}>
            <EventItem event={event} />
          </li>
        ))}
      </ul>
    </RailCard>
  )
}

export function EventItem({ event }: { event: CommunityEvent }) {
  return (
    <Link to={paths.event(event.id)} className="group flex items-stretch gap-[7px]">
      <div className="relative min-h-[90px] min-w-0 flex-1 overflow-hidden bg-grey-30">
        {event.imageUrl && <img src={event.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />}
      </div>
      <div className="flex w-[64%] shrink-0 flex-col gap-2">
        <span className="w-fit rounded-full bg-brand-orange-tint px-2 py-[5px] text-xs font-semibold text-brand-orange uppercase">
          {event.category}
        </span>
        <div className="flex flex-col gap-2">
          <h3 className="text-body-s font-medium text-fg group-hover:underline">{event.title}</h3>
          <p className="text-caption text-fg-muted">{event.description}</p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-fg">
          <span className="flex items-center gap-[3px]">
            <CalendarDots aria-hidden className="size-3.5 text-brand-orange" />
            {formatDateRange(event.startsAt, event.endsAt)}
          </span>
          <span className="flex items-center gap-[3px]">
            <NavigationArrow aria-hidden className="size-3.5 text-brand-orange" />
            {event.location}
          </span>
        </div>
      </div>
    </Link>
  )
}

function CardSkeleton() {
  return <div aria-hidden className="h-48 animate-pulse rounded-card border border-hairline bg-surface" />
}
