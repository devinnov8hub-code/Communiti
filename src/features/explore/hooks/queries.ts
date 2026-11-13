import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exploreApi, usersApi } from '@/lib/api'
import { toExploreEvent, toHighlight, toInnovation } from '../mappers'

export const exploreKeys = {
  all: ['explore'] as const,
  innovations: (topicIds: string[]) => [...exploreKeys.all, 'innovations', topicIds] as const,
  innovation: (id: string) => [...exploreKeys.all, 'innovation', id] as const,
  highlights: (exclude?: { id: string; eventId?: string }) =>
    [...exploreKeys.all, 'highlights', exclude ?? {}] as const,
  highlight: (id: string) => [...exploreKeys.all, 'highlight', id] as const,
  events: (when: 'upcoming' | 'concluded') => [...exploreKeys.all, 'events', when] as const,
  event: (id: string) => [...exploreKeys.all, 'event', id] as const,
  people: () => [...exploreKeys.all, 'people'] as const,
}

/** "Suggested people": members with profiles most like yours that you don't follow yet. */
export const useSuggestedPeople = (limit = 10) =>
  useQuery({
    queryKey: exploreKeys.people(),
    queryFn: () => usersApi.listSuggestedUsers({ limit }).then((page) => page.data),
  })

/** Featured innovations; "Sort topics" passes topic ids (items on any of them). */
export const useInnovations = (topicIds: string[] = []) =>
  useQuery({
    queryKey: exploreKeys.innovations(topicIds),
    queryFn: () =>
      exploreApi
        .listFeaturedInnovations({ topicIds: topicIds.length ? topicIds.join(',') : undefined, limit: 50 })
        .then((page) => page.data),
    select: (items) => items.map(toInnovation),
  })

export const useInnovation = (id: string) =>
  useQuery({
    queryKey: exploreKeys.innovation(id),
    queryFn: () => exploreApi.getFeaturedInnovation(id),
    select: toInnovation,
  })

/** Highlight albums, newest first, a page at a time. `exclude` is the "More like this" form. */
export const useHighlights = (exclude?: { id: string; eventId?: string }, enabled = true) =>
  useInfiniteQuery({
    enabled,
    queryKey: exploreKeys.highlights(exclude),
    queryFn: ({ pageParam }) =>
      exploreApi.listHighlights({ cursor: pageParam, exclude: exclude?.id, eventId: exclude?.eventId }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    // Albums without a photo have nothing to show in the mosaic.
    select: (data) => data.pages.flatMap((page) => page.data.map(toHighlight)).filter((item) => item.imageUrl),
  })

export const useHighlight = (id: string) =>
  useQuery({ queryKey: exploreKeys.highlight(id), queryFn: () => exploreApi.getHighlight(id), select: toHighlight })

/** Upcoming: soonest first. Concluded: most recent first. */
export const useExploreEvents = (when: 'upcoming' | 'concluded') =>
  useQuery({
    queryKey: exploreKeys.events(when),
    queryFn: () => exploreApi.listEvents({ when, limit: 50 }).then((page) => page.data),
    select: (events) => events.map(toExploreEvent),
  })

export const useExploreEvent = (id: string) =>
  useQuery({ queryKey: exploreKeys.event(id), queryFn: () => exploreApi.getEvent(id), select: toExploreEvent })

/** Register = RSVP "going"; cancelling removes the RSVP. */
export function useEventRegistration() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, registered }: { id: string; registered: boolean }) => {
      if (registered) return exploreApi.rsvpToEvent(id, { status: 'going' })
      await exploreApi.removeEventRsvp(id)
      return exploreApi.getEvent(id)
    },
    onSuccess: (event) => {
      client.setQueryData(exploreKeys.event(event.id), event)
      client.invalidateQueries({ queryKey: [...exploreKeys.all, 'events'] })
    },
  })
}
