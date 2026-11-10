import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { TOKEN_CHANGED_EVENT, tokens } from '@/lib/api/tokens'

/*
 * Supabase Realtime (backend FRONTEND_INTEGRATION.md §9). The backend broadcasts on private
 * channels and authorises them with the member's normal access token, so there is no separate
 * Supabase sign-in. Without the env keys the app falls back to polling.
 *
 * VITE_SUPABASE_KEY must be the project's anon / publishable key — it ships to every browser.
 * The Supabase library is loaded on first use so it stays out of the initial bundle.
 */

const env = import.meta.env
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_KEY

/** A secret / service-role key would give every visitor full database access: refuse to use it. */
function isSecretKey(value: string) {
  if (value.startsWith('sb_secret_')) return true
  try {
    return JSON.parse(atob(value.split('.')[1] ?? ''))?.role === 'service_role'
  } catch {
    return false
  }
}

const configured = Boolean(url && key) && !isSecretKey(key ?? '')
if (key && isSecretKey(key)) {
  console.error('VITE_SUPABASE_KEY is a secret key. Use the anon / publishable key; realtime is off.')
}

/** True when realtime is configured; screens poll less often then. */
export const realtimeEnabled = configured

let clientPromise: Promise<SupabaseClient> | null = null

function getClient() {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const client = createClient(url!, key!, { accessToken: async () => tokens.get('member') })
    // Re-authorise open channels whenever the access token is refreshed or the member signs in/out.
    window.addEventListener(TOKEN_CHANGED_EVENT, (event) => {
      if ((event as CustomEvent).detail === 'member') void client.realtime.setAuth()
    })
    return client
  })
  return clientPromise
}

type Handler = (payload: unknown) => void

interface Topic {
  handlers: Map<string, Set<Handler>>
  /** Set once the library has loaded and the channel is open. */
  channel?: RealtimeChannel
  closed: boolean
}

const topics = new Map<string, Topic>()

function open(topicName: string, topic: Topic) {
  void getClient().then((client) => {
    if (topic.closed) return
    const channel = client.channel(topicName, { config: { private: true } })
    // One catch-all listener routes events, so listeners can be added after subscribing.
    channel.on('broadcast', { event: '*' }, (message) =>
      topic.handlers.get(message.event)?.forEach((listener) => listener(message.payload)),
    )
    channel.subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' && import.meta.env.DEV) console.warn(`Realtime ${topicName}:`, error)
    })
    topic.channel = channel
  })
}

/**
 * Listen to one broadcast event on a private channel (e.g. `conversation:<id>`, `message:new`).
 * Components can subscribe to the same channel many times; it is opened once and closed when
 * the last listener leaves. Returns the unsubscribe function.
 */
export function subscribe(topicName: string, event: string, handler: Handler): () => void {
  if (!configured) return () => undefined

  let topic = topics.get(topicName)
  if (!topic) {
    topic = { handlers: new Map(), closed: false }
    topics.set(topicName, topic)
    open(topicName, topic)
  }

  const listeners = topic.handlers.get(event) ?? new Set<Handler>()
  listeners.add(handler)
  topic.handlers.set(event, listeners)

  const current = topic
  return () => {
    listeners.delete(handler)
    if (listeners.size === 0) current.handlers.delete(event)
    if (current.handlers.size > 0) return
    current.closed = true
    topics.delete(topicName)
    if (current.channel) void getClient().then((client) => client.removeChannel(current.channel!))
  }
}
