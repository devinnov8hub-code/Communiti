import { paths } from '@/app/paths'

/** Builds /search?q=...&topic=... */
export function searchUrl(query: string, topic?: string) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (topic) params.set('topic', topic)
  return `${paths.search}?${params}`
}
