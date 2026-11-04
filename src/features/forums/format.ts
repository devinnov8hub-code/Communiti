import type { TagTone } from '@/components/ui/Tag'

/** "Created June 2006" */
export const createdLabel = (iso: string) =>
  `Created ${new Date(iso).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`

/** Focus tags cycle green, blue, yellow as in the design. */
const TOPIC_TONES: TagTone[] = ['success', 'info', 'warning']
export const topicTone = (index: number) => TOPIC_TONES[index % TOPIC_TONES.length]
