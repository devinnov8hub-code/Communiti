import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exploreApi } from '../api/explore.service'
import type { ExploreEvent } from '../types'

export const exploreKeys = {
  all: ['explore'] as const,
  innovations: (topics: string[]) => [...exploreKeys.all, 'innovations', topics] as const,
  innovation: (id: string) => [...exploreKeys.all, 'innovation', id] as const,
  highlights: () => [...exploreKeys.all, 'highlights'] as const,
  highlight: (id: string) => [...exploreKeys.all, 'highlight', id] as const,
  events: () => [...exploreKeys.all, 'events'] as const,
  event: (id: string) => [...exploreKeys.all, 'event', id] as const,
}

export const useInnovations = (topics: string[] = []) =>
  useQuery({ queryKey: exploreKeys.innovations(topics), queryFn: () => exploreApi.getInnovations(topics) })

export const useInnovation = (id: string) =>
  useQuery({ queryKey: exploreKeys.innovation(id), queryFn: () => exploreApi.getInnovation(id) })

export const useHighlights = () => useQuery({ queryKey: exploreKeys.highlights(), queryFn: exploreApi.getHighlights })

export const useHighlight = (id: string) =>
  useQuery({ queryKey: exploreKeys.highlight(id), queryFn: () => exploreApi.getHighlight(id) })

export const useExploreEvents = () => useQuery({ queryKey: exploreKeys.events(), queryFn: exploreApi.getEvents })

export const useExploreEvent = (id: string) =>
  useQuery({ queryKey: exploreKeys.event(id), queryFn: () => exploreApi.getEvent(id) })

export function useEventRegistration() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, registered }: { id: string; registered: boolean }) =>
      exploreApi.setEventRegistration(id, registered),
    onSuccess: (event: ExploreEvent) => {
      client.setQueryData(exploreKeys.event(event.id), event)
      client.invalidateQueries({ queryKey: exploreKeys.events() })
    },
  })
}
