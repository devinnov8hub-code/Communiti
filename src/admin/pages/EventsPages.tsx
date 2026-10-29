import { CalendarDots, CaretLeft, CaretRight, NavigationArrow, UserPlus } from '@phosphor-icons/react'
import { useDeferredValue, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ActionButton, IconButton, Spinner } from '@/components/ui'
import type { AdminGetEventStatsResponse, Event as CommunityEvent } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { eventCategoryLabel, eventPlace } from '@/lib/events'
import { formatDateRange } from '@/lib/format'
import { AddEventModal } from '../components/AddEventModal'
import { AdminEventCard } from '../components/AdminEventCard'
import { AdminTopBar } from '../components/AdminTopBar'
import { EVENT_STAT_ICONS } from '../components/statIcons'
import { ErrorState, StatSkeleton } from '../components/states'
import { AdminContent, Breadcrumb, StatGrid } from '../components/ui'
import { useAdminEvent, useAdminEventList, useEventStats } from '../hooks/queries'
import { adminPaths } from '../paths'
import { kpiCard } from '../stats'
import type { StatCardData } from '../types'

function eventStats(stats: AdminGetEventStatsResponse): StatCardData[] {
  return [
    kpiCard('total', 'Total', 'Events held', stats.total, 'orange'),
    kpiCard('active', 'Active', 'Currently running', stats.active, 'green'),
    kpiCard('concluded', 'Concluded', 'Completed events', stats.concluded, 'grey'),
    kpiCard('upcoming', 'Upcoming', 'Upcoming events', stats.upcoming, 'blue'),
  ]
}

/** Events dashboard (Figma "EVENTS PAGE"). */
export function EventsPage() {
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [showAllConcluded, setShowAllConcluded] = useState(false)
  const query = useDeferredValue(search.trim()) || undefined
  const stats = useEventStats()
  const active = useAdminEventList('active', query)
  const upcoming = useAdminEventList('upcoming', query)
  const concluded = useAdminEventList('concluded', query)
  const lists = [active, upcoming, concluded]
  const failed = lists.find((list) => list.isError)

  // Running events lead the "Upcoming Events" row. One that starts between the two
  // requests could be in both lists, so keep the first copy.
  const next = [...(active.data?.data ?? []), ...(upcoming.data?.data ?? [])].filter(
    (event, index, all) => all.findIndex((other) => other.id === event.id) === index,
  )
  const done = concluded.data?.data ?? []

  return (
    <>
      <AdminTopBar title="Events" searchPlaceholder="Search in Events" search={search} onSearch={setSearch} />
      <AdminContent>
        <ActionButton onClick={() => setAdding(true)} className="self-end">
          Add Event
        </ActionButton>
        {stats.data ? <StatGrid stats={eventStats(stats.data)} icons={EVENT_STAT_ICONS} /> : <StatSkeleton />}
        {failed ? (
          <ErrorState message={getErrorMessage(failed.error)} onRetry={() => lists.forEach((list) => list.refetch())} />
        ) : lists.some((list) => list.isPending) ? (
          <div className="flex justify-center py-16 text-brand-orange">
            <Spinner />
          </div>
        ) : (
          <>
            <EventRow title="Upcoming Events" events={next} />
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-h4 font-semibold text-fg">Concluded</h2>
                {done.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllConcluded((value) => !value)}
                    className="text-body-m font-semibold text-brand-orange hover:underline"
                  >
                    {showAllConcluded ? 'Show less' : 'View All'}
                  </button>
                )}
              </div>
              {done.length ? (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {(showAllConcluded ? done : done.slice(0, 4)).map((event) => (
                    <li key={event.id}>
                      <AdminEventCard event={event} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-body-m text-fg-muted">No concluded events.</p>
              )}
            </section>
          </>
        )}
      </AdminContent>
      {adding && <AddEventModal onClose={() => setAdding(false)} />}
    </>
  )
}

/** Horizontally scrolling row with prev/next arrows (Figma "Upcoming Events"). */
function EventRow({ title, events }: { title: string; events: CommunityEvent[] }) {
  const scroller = useRef<HTMLUListElement>(null)
  const scroll = (direction: 1 | -1) =>
    scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h4 font-semibold text-fg">{title}</h2>
        <div className="flex gap-2">
          <IconButton
            label="Previous events"
            onClick={() => scroll(-1)}
            className="size-6 border border-hairline text-fg-muted"
          >
            <CaretLeft className="size-3.5" />
          </IconButton>
          <IconButton label="Next events" onClick={() => scroll(1)} className="size-6 border border-hairline text-fg">
            <CaretRight className="size-3.5" />
          </IconButton>
        </div>
      </div>
      {events.length ? (
        <ul
          ref={scroller}
          className="-mx-1 flex snap-x snap-mandatory [scrollbar-width:thin] gap-3 overflow-x-auto px-1 pb-2"
        >
          {events.map((event) => (
            <li key={event.id} className="w-[262px] shrink-0 snap-start">
              <AdminEventCard event={event} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-body-m text-fg-muted">No upcoming events.</p>
      )}
    </section>
  )
}

/** Event detail with the upcoming list beside it (Figma "Event view"). */
export function EventDetailPage() {
  const { eventId = '' } = useParams()
  const event = useAdminEvent(eventId)
  const upcoming = useAdminEventList('upcoming')
  const others = upcoming.data?.data.filter((item) => item.id !== eventId).slice(0, 6)

  return (
    <div className="flex flex-col xl:flex-row">
      <div className="min-w-0 flex-1">
        <AdminTopBar title="Challenge view" back={adminPaths.events} />
        <AdminContent className="gap-12 lg:px-[33px]">
          {event.isPending ? (
            <div className="flex justify-center py-24 text-brand-orange">
              <Spinner />
            </div>
          ) : event.isError ? (
            <ErrorState message={getErrorMessage(event.error)} onRetry={() => event.refetch()} />
          ) : (
            <>
              <Breadcrumb items={[{ label: 'Events', to: adminPaths.events }, { label: event.data.title }]} />
              <article className="flex flex-col gap-gap-md sm:px-5">
                <div className="flex flex-col gap-3">
                  {event.data.coverUrl && (
                    <img
                      src={event.data.coverUrl}
                      alt=""
                      className="h-[220px] w-full rounded-sm object-cover sm:h-[355px]"
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-[9px]">
                    <h2 className="text-h4 font-semibold text-fg">{event.data.title}</h2>
                    <span className="rounded-full bg-brand-orange-tint px-2 py-[5px] text-body-m text-brand-orange uppercase dark:bg-brand-orange/15">
                      {eventCategoryLabel(event.data.category)}
                    </span>
                  </div>
                  <dl className="flex flex-wrap justify-center">
                    <div className="flex flex-col gap-2.5 px-2.5">
                      <dt className="flex items-center gap-[3px] text-body-m text-fg">
                        <CalendarDots aria-hidden className="size-3.5 text-brand-orange" />
                        Date
                      </dt>
                      <dd className="text-body-m text-fg">{formatDateRange(event.data.startsAt, event.data.endsAt)}</dd>
                    </div>
                    <div className="flex flex-col gap-2.5 border-l border-hairline px-2.5">
                      <dt className="flex items-center gap-[3px] text-body-m text-fg">
                        <NavigationArrow aria-hidden className="size-3.5 -scale-x-100 text-brand-orange" />
                        Location
                      </dt>
                      <dd className="text-body-m text-fg">{eventPlace(event.data)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-body-l font-semibold text-fg">About this event</h3>
                  <p className="text-body-m whitespace-pre-line text-fg-muted">
                    {event.data.description || event.data.summary}
                  </p>
                </div>
                {event.data.organizerName && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-body-m font-semibold text-fg">Organized by</h3>
                    <div className="flex items-center gap-2">
                      {event.data.organizerLogoUrl && (
                        <img src={event.data.organizerLogoUrl} alt="" className="size-10 object-cover" />
                      )}
                      <div className="flex flex-col gap-[7px]">
                        <p className="text-body-s text-fg">{event.data.organizerName}</p>
                        {event.data.organizerTagline && (
                          <p className="text-caption text-fg-muted">{event.data.organizerTagline}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {event.data.registrationUrl && (
                  <a
                    href={event.data.registrationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-[42px] items-center gap-2 self-start rounded-control bg-brand-orange px-5 text-body-m font-semibold text-white hover:brightness-95"
                  >
                    <UserPlus aria-hidden className="size-5" />
                    Register
                  </a>
                )}
              </article>
            </>
          )}
        </AdminContent>
      </div>
      <aside className="flex flex-col gap-4 bg-surface-raised px-4 py-6 sm:px-[14px] xl:sticky xl:top-0 xl:h-dvh xl:w-[436px] xl:shrink-0 xl:overflow-y-auto xl:rounded-l-modal xl:pt-11">
        <h2 className="text-body-l font-semibold text-fg">Upcoming Events</h2>
        {others?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {others.map((item) => (
              <li key={item.id}>
                <AdminEventCard event={item} className="border border-hairline" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-s text-fg-muted">No other upcoming events.</p>
        )}
      </aside>
    </div>
  )
}
