const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/** "10 hours ago", "yesterday", "just now". */
export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function ordinal(day: number) {
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th'
  return `${day}${suffix}`
}

/** "May 1st 2026  10:20 AM" — the post-detail timestamp. */
export function formatPostTimestamp(iso: string) {
  const date = new Date(iso)
  const month = date.toLocaleString('en-US', { month: 'long' })
  const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${month} ${ordinal(date.getDate())} ${date.getFullYear()}  ${time}`
}

/** "Jun 26 - Jun 30, 2026" */
export function formatDateRange(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const short = (date: Date) => date.toLocaleString('en-US', { month: 'short', day: 'numeric' })
  return `${short(start)} - ${short(end)}, ${end.getFullYear()}`
}

export const formatCount = (value: number) => new Intl.NumberFormat('en-US').format(value)

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

/** Days between two calendar dates (ignores the time of day). */
function dayDiff(date: Date, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

/** "Today", "Yesterday" or "Wednesday 26th August, 2026" — ledger day headings. */
export function formatDayHeading(iso: string, now = new Date()) {
  const date = new Date(iso)
  if (dayKey(date) === dayKey(now)) return 'Today'
  if (dayDiff(date, now) === -1) return 'Yesterday'
  const weekday = date.toLocaleString('en-US', { weekday: 'long' })
  const month = date.toLocaleString('en-US', { month: 'long' })
  return `${weekday} ${ordinal(date.getDate())} ${month}, ${date.getFullYear()}`
}

/** "11:34 AM" */
export const formatTime = (iso: string) => new Date(iso).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })

/** "Due Today", "Due Tomorrow", "Overdue · Oct 2", "Due Oct 5" for a YYYY-MM-DD date. */
export function formatDue(isoDate: string, now = new Date()) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const diff = dayDiff(date, now)
  const short = date.toLocaleString('en-US', { month: 'short', day: 'numeric' })
  if (diff === 0) return 'Due Today'
  if (diff === 1) return 'Due Tomorrow'
  if (diff < 0) return `Overdue · ${short}`
  return `Due ${short}`
}

/** "December 22 2026" for a YYYY-MM-DD date. */
export function formatLongDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${date.toLocaleString('en-US', { month: 'long' })} ${date.getDate()} ${date.getFullYear()}`
}

/** "spam" → "Spam", "remove_content" → "Remove content" — backend enum values for display. */
export const titleCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, ' ')
