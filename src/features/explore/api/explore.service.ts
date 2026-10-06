import eventCard from '@/assets/mock/explore/event-card.webp'
import eventHero from '@/assets/mock/explore/event-hero.webp'
import featuredVr from '@/assets/mock/explore/featured-vr.webp'
import highlightHero from '@/assets/mock/explore/highlight-hero.webp'
import innovationDrone from '@/assets/mock/explore/innovation-drone.webp'
import innovationSolar from '@/assets/mock/explore/innovation-solar.webp'
import innovationVr from '@/assets/mock/explore/innovation-vr.webp'
import organizer from '@/assets/mock/explore/organizer.webp'
import thumb1 from '@/assets/mock/explore/thumb-1.webp'
import thumb2 from '@/assets/mock/explore/thumb-2.webp'
import thumb3 from '@/assets/mock/explore/thumb-3.webp'
import thumb4 from '@/assets/mock/explore/thumb-4.webp'
import vrHero from '@/assets/mock/explore/vr-hero.webp'
import { ApiError } from '@/lib/api/errors'
import { apiRequest, USE_MOCK_API } from '@/lib/api/legacy'
import type { ExploreEvent, Highlight, Innovation } from '../types'

/** Explore API contract. See README for the endpoint list. */
export interface ExploreApi {
  getInnovations(topics?: string[]): Promise<Innovation[]>
  getInnovation(id: string): Promise<Innovation>
  getHighlights(): Promise<Highlight[]>
  getHighlight(id: string): Promise<Highlight>
  getEvents(): Promise<ExploreEvent[]>
  getEvent(id: string): Promise<ExploreEvent>
  setEventRegistration(id: string, registered: boolean): Promise<ExploreEvent>
}

const httpExploreApi: ExploreApi = {
  getInnovations: (topics = []) =>
    apiRequest(`/innovations${topics.length ? `?${new URLSearchParams({ topics: topics.join(',') })}` : ''}`),
  getInnovation: (id) => apiRequest(`/innovations/${id}`),
  getHighlights: () => apiRequest('/highlights'),
  getHighlight: (id) => apiRequest(`/highlights/${id}`),
  getEvents: () => apiRequest('/events'),
  getEvent: (id) => apiRequest(`/events/${id}`),
  setEventRegistration: (id, registered) =>
    apiRequest(`/events/${id}/registration`, { method: registered ? 'PUT' : 'DELETE' }),
}

/* ------------------------- Mock (Figma content) ------------------------- */

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const DRONE_COPY = [
  'Drones, also known as unmanned aerial vehicles (UAVs), are cutting-edge technological marvels that have transformed the way we perceive aerial operations. These versatile devices can be operated remotely or programmed to fly autonomously, showcasing their adaptability in various scenarios. Equipped with high-resolution cameras and advanced sensors, drones excel in applications ranging from stunning aerial photography to critical surveillance missions. Their integration into delivery services has revolutionized logistics, allowing for rapid transport of goods across urban landscapes.',
  'As technology continues to advance, drones are becoming more accessible to the general public, paving the way for innovative uses in everyday life. Industries such as agriculture, construction, and environmental monitoring are leveraging drone capabilities to enhance efficiency and data accuracy. For instance, farmers utilize drones for crop monitoring, enabling precise assessments of plant health and resource allocation.',
  'Moreover, drones are equipped with sophisticated navigation systems that allow them to maneuver through complex environments, including urban areas and rugged terrains. This capability opens up new frontiers for exploration, enabling researchers to gather data in previously inaccessible locations. The potential for drones in search and rescue operations is also significant, as they can quickly survey disaster-stricken areas and locate individuals in need of assistance.',
  'In summary, the evolution of drone technology is not just a trend; it represents a paradigm shift in how we approach various tasks and challenges. As we continue to innovate, the possibilities for drone applications are limitless, promising a future where these aerial devices play an integral role in our daily lives.',
]

const gallery = [thumb1, thumb2, thumb3, thumb4, thumb4, thumb4]

const innovations: Innovation[] = [
  {
    id: 'vr-interface',
    title: 'VR Interface',
    tagline: 'Immersive VR Interface Prototype',
    topic: 'education',
    thumbUrl: innovationVr,
    coverUrl: featuredVr,
    gallery: [vrHero, ...gallery],
    description: DRONE_COPY,
  },
  {
    id: 'solar-pals',
    title: 'Solar-Pals',
    tagline: 'Smart Solar-Powered  Lamp Post Prototype',
    topic: 'sustainability',
    thumbUrl: innovationSolar,
    coverUrl: featuredVr,
    gallery: [vrHero, ...gallery],
    description: DRONE_COPY,
  },
  {
    id: 'ai-drone',
    title: 'AI Drone',
    tagline: 'AI-Driven Autonomous Drone Prototype',
    topic: 'agriculture',
    thumbUrl: innovationDrone,
    coverUrl: featuredVr,
    gallery: [vrHero, ...gallery],
    description: DRONE_COPY,
  },
  {
    id: 'ai-drone-2',
    title: 'AI Drone',
    tagline: 'AI-Driven Autonomous Drone Prototype',
    topic: 'agriculture',
    thumbUrl: innovationDrone,
    coverUrl: featuredVr,
    gallery: [vrHero, ...gallery],
    description: DRONE_COPY,
  },
]

// All highlight photos, in the Figma mosaic order.
const highlightImages = Object.entries(
  import.meta.glob<string>('@/assets/mock/explore/highlight-*.webp', { eager: true, import: 'default' }),
)
  .sort(([a], [b]) => Number(a.match(/(\d+)\.webp$/)?.[1]) - Number(b.match(/(\d+)\.webp$/)?.[1]))
  .map(([, url]) => url)

const highlights: Highlight[] = highlightImages.map((imageUrl, index) => ({
  id: `h-${index + 1}`,
  title: 'Research for impact',
  imageUrl,
}))
highlights.unshift({ id: 'research-for-impact', title: 'Research for impact', imageUrl: highlightHero })

const ABOUT =
  "Innovate Challenge 2026 is a 48-hour hackathon that brings together innovators, developers, designers, entrepreneurs, and problem-solvers to collaborate on real-world challenges. Participants will work in teams to develop creative solutions, receive guidance from experienced mentors, expand their professional networks, and showcase their ideas to a panel of judges. Whether you're an experienced innovator or just getting started, this event offers a unique opportunity to learn, collaborate, and turn bold ideas into impactful solutions."

let events: ExploreEvent[] = Array.from({ length: 8 }, (_, index) => ({
  id: `ev-${index + 1}`,
  category: 'Hackathon',
  title: 'Innovate Challenge 2026',
  summary: 'Solve a 48 hr challenge solution for real problems',
  about: ABOUT,
  startsAt: '2026-06-26T09:00:00',
  endsAt: '2026-06-30T17:00:00',
  location: 'Innovation Hub, Lugbe',
  fullLocation: 'Innovation Hub, Lugbe, Abuja',
  imageUrl: eventCard,
  coverUrl: eventHero,
  organizer: { name: 'Innovation Hub', subtitle: 'Creative Media', logoUrl: organizer },
  status: index < 4 ? 'upcoming' : 'concluded',
  registered: false,
}))

const mockExploreApi: ExploreApi = {
  async getInnovations(topics = []) {
    await delay()
    return topics.length ? innovations.filter((item) => topics.includes(item.topic)) : innovations
  },
  async getInnovation(id) {
    await delay()
    const item = innovations.find((innovation) => innovation.id === id)
    if (!item) throw new ApiError('This innovation could not be found.', 404)
    return item
  },
  async getHighlights() {
    await delay()
    return highlights.slice(1)
  },
  async getHighlight(id) {
    await delay()
    const item = id === 'research-for-impact' ? highlights[0] : highlights.find((highlight) => highlight.id === id)
    if (!item) throw new ApiError('This highlight could not be found.', 404)
    return item
  },
  async getEvents() {
    await delay()
    return events
  },
  async getEvent(id) {
    await delay()
    const item = events.find((event) => event.id === id)
    if (!item) throw new ApiError('This event could not be found.', 404)
    return item
  },
  async setEventRegistration(id, registered) {
    await delay()
    events = events.map((event) => (event.id === id ? { ...event, registered } : event))
    return events.find((event) => event.id === id)!
  },
}

export const exploreApi: ExploreApi = USE_MOCK_API ? mockExploreApi : httpExploreApi
