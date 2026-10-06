import { CalendarDots, CaretLeft, CaretRight, UserPlus } from '@phosphor-icons/react'
import { useDeferredValue, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ActionButton, IconButton, Spinner, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { formatDateRange } from '@/lib/format'
import { AddEventModal } from '../components/AddEventModal'
import { AdminEventCard } from '../components/AdminEventCard'
import { AdminTopBar } from '../components/AdminTopBar'
import { EVENT_STAT_ICONS } from '../components/statIcons'
import { ErrorState, StatSkeleton } from '../components/states'
import { AdminContent, Breadcrumb, StatGrid } from '../components/ui'
import { useAdminEvent, useAdminEvents } from '../hooks/queries'
import { adminPaths } from '../paths'
import type { AdminEvent, StatCardData } from '../types'

function eventStats(events: AdminEvent[]): StatCardData[] {
  const upcoming = events.filter((event) => event.status === 'upcoming')
  const now = Date.now()
  const running = upcoming.filter((event) => new Date(event.startsAt).getTime() <= now).length
  return [
    { id: 'total', label: 'Total', caption: 'Events held', value: events.length, change: 24, tone: 'orange' },
    { id: 'active', label: 'Active', caption: 'Currently running', value: running, change: 24, tone: 'green' },
    {
      id: 'concluded',
      label: 'Concluded',
      caption: 'Completed events',
      value: events.length - upcoming.length,
      change: 24,
      tone: 'grey',
    },
    { id: 'upcoming', label: 'Upcoming', caption: 'Upcoming events', value: upcoming.length, change: 24, tone: 'blue' },
  ]
}

/** Events dashboard (Figma "EVENTS PAGE"). */
export function EventsPage() {
  const events = useAdminEvents()
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [showAllConcluded, setShowAllConcluded] = useState(false)
  const query = useDeferredValue(search.trim().toLowerCase())

  const visible = events.data?.filter((event) =>
    `${event.title} ${event.category} ${event.location}`.toLowerCase().includes(query),
  )
  const upcoming = visible?.filter((event) => event.status === 'upcoming') ?? []
  const concluded = visible?.filter((event) => event.status === 'concluded') ?? []

  return (
    <>
      <AdminTopBar title="Events" searchPlaceholder="Search in Events" search={search} onSearch={setSearch} />
      <AdminContent>
        <ActionButton onClick={() => setAdding(true)} className="self-end">
          Add Event
        </ActionButton>
        {events.isError ? (
          <ErrorState message={getErrorMessage(events.error)} onRetry={() => events.refetch()} />
        ) : !events.data ? (
          <StatSkeleton />
        ) : (
          <>
            <StatGrid stats={eventStats(events.data)} icons={EVENT_STAT_ICONS} />
            <EventRow title="Upcoming Events" events={upcoming} />
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-h4 font-semibold text-fg">Concluded</h2>
                {concluded.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllConcluded((value) => !value)}
                    className="text-body-m font-semibold text-brand-orange hover:underline"
                  >
                    {showAllConcluded ? 'Show less' : 'View All'}
                  </button>
                )}
              </div>
              {concluded.length ? (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {(showAllConcluded ? concluded : concluded.slice(0, 4)).map((event) => (
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
function EventRow({ title, events }: { title: string; events: AdminEvent[] }) {
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
  const events = useAdminEvents()
  const toast = useToast()
  const others = events.data?.filter((item) => item.status === 'upcoming' && item.id !== eventId).slice(0, 6)

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
                  <img
                    src={event.data.coverUrl}
                    alt=""
                    className="h-[220px] w-full rounded-sm object-cover sm:h-[355px]"
                  />
                  <div className="flex flex-wrap items-center gap-[9px]">
                    <h2 className="text-h4 font-semibold text-fg">{event.data.title}</h2>
                    <span className="rounded-full bg-brand-orange-tint px-2 py-[5px] text-body-m text-brand-orange uppercase dark:bg-brand-orange/15">
                      {event.data.category}
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
                        <CalendarDots aria-hidden className="size-3.5 text-brand-orange" />
                        Location
                      </dt>
                      <dd className="text-body-m text-fg">{event.data.fullLocation}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-body-l font-semibold text-fg">About this event</h3>
                  <p className="text-body-m text-fg-muted">{event.data.about}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-body-m font-semibold text-fg">Organized by</h3>
                  <div className="flex items-center gap-2">
                    <img src={event.data.organizer.logoUrl} alt="" className="size-10 object-cover" />
                    <div className="flex flex-col gap-[7px]">
                      <p className="text-body-s text-fg">{event.data.organizer.name}</p>
                      <p className="text-caption text-fg-muted">{event.data.organizer.subtitle}</p>
                    </div>
                  </div>
                </div>
                <ActionButton
                  icon={<UserPlus aria-hidden className="size-5" />}
                  onClick={async () => {
                    // Admins share the public registration page with attendees.
                    try {
                      await navigator.clipboard.writeText(`${window.location.origin}${paths.event(event.data.id)}`)
                      toast('Registration link copied')
                    } catch {
                      toast('Couldn’t copy the link')
                    }
                  }}
                  className="self-start"
                >
                  Register
                </ActionButton>
              </article>
            </>
          )}
        </AdminContent>
      </div>
      <aside className="flex flex-col gap-4 bg-surface-raised px-4 py-6 sm:px-[14px] xl:sticky xl:top-0 xl:h-dvh xl:w-[436px] xl:shrink-0 xl:overflow-y-auto xl:rounded-l-modal xl:pt-11">
        <h2 className="text-body-l font-semibold text-fg">Upcoming Events</h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {others?.map((item) => (
            <li key={item.id}>
              <AdminEventCard event={item} className="border border-hairline" />
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
