export type ExploreTab = 'suggested' | 'highlights' | 'featured'

export interface Innovation {
  id: string
  title: string
  tagline: string
  topic: string
  thumbUrl: string
  coverUrl: string
  gallery: string[]
  /** Paragraphs */
  description: string[]
}

export interface Highlight {
  id: string
  title: string
  imageUrl: string
}

export type EventStatus = 'upcoming' | 'concluded'

export interface ExploreEvent {
  id: string
  category: string
  title: string
  summary: string
  about: string
  startsAt: string
  endsAt: string
  location: string
  fullLocation: string
  imageUrl: string
  coverUrl: string
  organizer: { name: string; subtitle: string; logoUrl: string }
  status: EventStatus
  registered: boolean
}
