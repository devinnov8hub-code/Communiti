import { CalendarDots, CheckCircle, NavigationArrow, UserPlus } from '@phosphor-icons/react'
import { useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PageColumns } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { EmptyState, Spinner, useToast } from '@/components/ui'
import { RightRail } from '@/features/feed/components/RightRail'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { formatDateRange } from '@/lib/format'
import { useEventRegistration, useExploreEvent } from '../hooks/queries'

/** Event detail (Figma "Events view"). */
export function EventPage() {
  const { eventId = '' } = useParams()
  const event = useExploreEvent(eventId)
  const register = useEventRegistration()
  const toast = useToast()

  return (
    <PageColumns aside={<RightRail />}>
      <BackHeader title="Event" fallback={paths.events} />
      <div className="px-4 py-5 sm:px-5">
        {event.isPending ? (
          <div className="h-[355px] animate-pulse rounded-[4px] bg-surface" />
        ) : event.isError ? (
          <EmptyState title="Event not found" description={getErrorMessage(event.error)} />
        ) : (
          <article className="flex flex-col gap-gap-md">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-[9px]">
                {event.data.coverUrl ? (
                  <img
                    src={event.data.coverUrl}
                    alt=""
                    className="h-[220px] w-full rounded-[4px] object-cover sm:h-[355px]"
                  />
                ) : (
                  <span aria-hidden className="h-[220px] w-full rounded-[4px] bg-surface sm:h-[355px]" />
                )}
                <div className="flex flex-wrap items-center gap-[9px]">
                  <h1 className="text-h4 font-semibold text-fg">{event.data.title}</h1>
                  <span className="rounded-full bg-brand-orange-tint px-2 py-[5px] text-body-m text-brand-orange uppercase">
                    {event.data.category}
                  </span>
                  {event.data.status === 'cancelled' && (
                    <span className="rounded-full bg-surface px-2 py-[5px] text-body-m text-error uppercase">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>
              <dl className="mx-auto grid w-fit grid-cols-2 text-body-s text-fg sm:text-body-m">
                <div className="flex flex-col gap-2.5 px-2.5">
                  <dt className="flex items-center gap-[3px]">
                    <CalendarDots aria-hidden className="size-3.5 text-brand-orange" />
                    Date
                  </dt>
                  <dd>{formatDateRange(event.data.startsAt, event.data.endsAt)}</dd>
                </div>
                <div className="flex flex-col gap-2.5 border-l border-hairline px-2.5">
                  <dt className="flex items-center gap-[3px]">
                    <NavigationArrow aria-hidden className="size-3.5 text-brand-orange" />
                    Location
                  </dt>
                  <dd>{event.data.fullLocation}</dd>
                </div>
              </dl>
            </div>

            <section className="flex flex-col gap-2">
              <h2 className="text-body-l font-semibold text-fg">About this event</h2>
              <p className="text-body-m text-fg-muted">{event.data.about}</p>
            </section>

            {event.data.organizer && (
              <section className="flex flex-col gap-2">
                <h2 className="text-body-m font-semibold text-fg">Organized by</h2>
                <div className="flex items-center gap-2">
                  {event.data.organizer.logoUrl && (
                    <img src={event.data.organizer.logoUrl} alt="" className="size-10 object-cover" />
                  )}
                  <div className="flex flex-col gap-[7px]">
                    <p className="text-body-s text-fg">{event.data.organizer.name}</p>
                    {event.data.organizer.subtitle && (
                      <p className="text-caption text-fg-muted">{event.data.organizer.subtitle}</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {event.data.status === 'upcoming' && (
              <button
                type="button"
                aria-pressed={event.data.registered}
                disabled={register.isPending}
                onClick={() => {
                  const registering = !event.data.registered
                  // Open the organiser's sign-up page now: browsers block pop-ups opened after a request.
                  if (registering && event.data.registrationUrl) {
                    window.open(event.data.registrationUrl, '_blank', 'noopener')
                  }
                  register.mutate(
                    { id: event.data.id, registered: registering },
                    {
                      onSuccess: () =>
                        toast(registering ? 'You’re attending — see you there!' : 'You’re no longer attending'),
                      onError: (error) => toast(getErrorMessage(error)),
                    },
                  )
                }}
                className={cn(
                  'flex w-fit items-center gap-2.5 rounded-control px-5 py-[15px] text-body-m font-semibold transition disabled:opacity-60',
                  event.data.registered
                    ? 'border border-brand-green text-brand-green'
                    : 'bg-brand-orange text-white hover:brightness-95',
                )}
              >
                {register.isPending ? (
                  <Spinner className="size-5" />
                ) : event.data.registered ? (
                  <CheckCircle aria-hidden className="size-5" />
                ) : (
                  <UserPlus aria-hidden className="size-5" />
                )}
                {event.data.registered ? 'Attending' : 'Register'}
              </button>
            )}
          </article>
        )}
      </div>
    </PageColumns>
  )
}
