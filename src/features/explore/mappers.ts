import type { Event, FeaturedInnovation, Highlight as ApiHighlight, Media } from '@/lib/api'
import type { ExploreEvent, Highlight, Innovation } from './types'

const imageUrls = (media: Media[]) => media.flatMap((item) => (item.kind === 'image' && item.url ? [item.url] : []))

/** Blank lines separate paragraphs; single line breaks stay inside one. */
const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

export function toInnovation(item: FeaturedInnovation): Innovation {
  const images = imageUrls(item.media)
  const coverUrl = item.coverUrl ?? images[0]
  return {
    id: item.id,
    title: item.title,
    tagline: item.summary,
    thumbUrl: coverUrl,
    coverUrl,
    gallery: item.coverUrl ? [item.coverUrl, ...images] : images,
    description: paragraphs(item.body || item.summary),
    shareUrl: item.shareUrl,
  }
}

export function toHighlight(album: ApiHighlight): Highlight {
  const images = imageUrls(album.media)
  return {
    id: album.id,
    title: album.title,
    caption: album.caption,
    imageUrl: images[0],
    images,
    eventId: album.event?.id,
  }
}

const CATEGORY_LABELS: Record<Event['category'], string> = {
  hackathon: 'Hackathon',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  networking_fair: 'Networking fair',
  meetup: 'Meetup',
  conference: 'Conference',
  webinar: 'Webinar',
  other: 'Event',
}

export function toExploreEvent(event: Event): ExploreEvent {
  const place = [event.venue, event.city, event.country].filter(Boolean).join(', ')
  return {
    id: event.id,
    category: CATEGORY_LABELS[event.category],
    title: event.title,
    summary: event.summary,
    about: event.description || event.summary,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: event.venue || event.city || (event.isOnline ? 'Online' : place),
    fullLocation: place || (event.isOnline ? 'Online' : ''),
    coverUrl: event.coverUrl ?? undefined,
    organizer: event.organizerName
      ? {
          name: event.organizerName,
          subtitle: event.organizerTagline ?? undefined,
          logoUrl: event.organizerLogoUrl ?? undefined,
        }
      : undefined,
    status:
      event.status === 'cancelled'
        ? 'cancelled'
        : new Date(event.endsAt).getTime() > Date.now()
          ? 'upcoming'
          : 'concluded',
    registered: event.myRsvp === 'going',
    registrationUrl: event.registrationUrl ?? undefined,
  }
}
