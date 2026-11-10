export type ExploreTab = 'suggested' | 'highlights' | 'featured'

/** A featured innovation (backend `FeaturedInnovation`, curated by admins). */
export interface Innovation {
  id: string
  title: string
  /** The backend's `summary`. */
  tagline: string
  /** Card / strip image: the cover, else the first gallery image. */
  thumbUrl?: string
  coverUrl?: string
  /** Cover first, then the gallery images. */
  gallery: string[]
  /** Paragraphs of the body. */
  description: string[]
  shareUrl: string
}

/** A community highlight album; the mosaic shows its first photo. */
export interface Highlight {
  id: string
  title: string
  caption: string
  imageUrl?: string
  /** Every photo in the album. */
  images: string[]
  /** The past event the album belongs to ("More like this" prefers the same event). */
  eventId?: string
}

export type EventStatus = 'upcoming' | 'concluded' | 'cancelled'

export interface ExploreEvent {
  id: string
  /** Display label, e.g. "Hackathon", "Networking fair". */
  category: string
  title: string
  summary: string
  about: string
  startsAt: string
  endsAt: string
  /** Short form for cards: venue, else city, else "Online". */
  location: string
  /** Venue, city and country. */
  fullLocation: string
  coverUrl?: string
  organizer?: { name: string; subtitle?: string; logoUrl?: string }
  status: EventStatus
  /** RSVP'd as going. */
  registered: boolean
  /** External sign-up page the Register button also opens. */
  registrationUrl?: string
}
