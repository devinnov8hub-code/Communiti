import type { Event as CommunityEvent } from '@/lib/api'

/** Event types in the order the admin form offers them (Figma sticky note). */
export const EVENT_CATEGORIES: { value: CommunityEvent['category']; label: string }[] = [
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'networking_fair', label: 'Networking / showcase fair' },
]

const OTHER_LABELS: Partial<Record<CommunityEvent['category'], string>> = {
  meetup: 'Meetup',
  conference: 'Conference',
  webinar: 'Webinar',
  other: 'Event',
}

/** "Hackathon", "Networking / showcase fair" … */
export const eventCategoryLabel = (category: CommunityEvent['category']) =>
  EVENT_CATEGORIES.find((item) => item.value === category)?.label ?? OTHER_LABELS[category] ?? category

/** Where it happens: "Innovation Hub, Lugbe", "Lagos, Nigeria" or "Online". */
export function eventPlace(event: Pick<CommunityEvent, 'venue' | 'city' | 'country' | 'isOnline'>) {
  const place = [event.venue, event.city].filter(Boolean).join(', ')
  if (place) return place
  if (event.isOnline) return 'Online'
  return event.country ?? 'Location to be announced'
}
