import type { AdminGetUserActivityStatsResponse, Kpi } from '@/lib/api'
import { DATE_RANGES, type DateRange, type StatCardData } from './types'

/** "Last 30 days" etc. — the caption most stat cards share. */
export const rangeLabel = (range: DateRange) => DATE_RANGES.find((item) => item.value === range)?.label ?? ''

/** One stat card from a backend KPI (value + % change vs the previous window). */
export const kpiCard = (
  id: string,
  label: string,
  caption: string,
  kpi: Kpi,
  tone: StatCardData['tone'],
): StatCardData => ({ id, label, caption, value: kpi.value, change: kpi.changePct ?? undefined, tone })

type ActivityMeasure = keyof Omit<AdminGetUserActivityStatsResponse['data'][number], 'date'>

/** Activity points (per day, or per month for 12 months) as chart bars. */
export function activityBars(activity: AdminGetUserActivityStatsResponse, measure: ActivityMeasure) {
  const label = new Intl.DateTimeFormat(
    'en',
    activity.bucket === 'month' ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' },
  )
  return activity.data.map((point) => ({ label: label.format(new Date(point.date)), value: point[measure] }))
}
