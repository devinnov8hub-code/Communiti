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

function ordinal(day: number) {
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
