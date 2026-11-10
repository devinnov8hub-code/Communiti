import { PageColumns } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/ui'
import { RightRail } from '@/features/feed/components/RightRail'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import { EventCard } from '../components/EventCard'
import { useExploreEvents } from '../hooks/queries'

/** All events: upcoming carousel + concluded grid (Figma "Events"). */
export function EventsPage() {
  const upcomingEvents = useExploreEvents('upcoming')
  const concludedEvents = useExploreEvents('concluded')
  const upcoming = upcomingEvents.data ?? []
  const concluded = concludedEvents.data ?? []

  return (
    <PageColumns aside={<RightRail />}>
      <SearchHeader />
      <div className="flex flex-col gap-[27px] px-4 py-2.5 sm:px-1.5">
        {upcomingEvents.isPending || concludedEvents.isPending ? (
          <div className="h-[335px] animate-pulse rounded-control bg-surface" />
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <h1 className="text-h4 font-semibold text-fg">Upcoming Events</h1>
              {upcoming.length ? (
                <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                  {upcoming.map((event) => (
                    <li key={event.id} className="w-[268px] shrink-0 snap-start">
                      <EventCard event={event} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No upcoming events" />
              )}
            </section>

            {concluded.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-h4 font-semibold text-fg">Concluded</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {concluded.map((event) => (
                    <li key={event.id}>
                      <EventCard event={event} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </PageColumns>
  )
}
