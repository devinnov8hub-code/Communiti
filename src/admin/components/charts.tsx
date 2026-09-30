import { cn } from '@/lib/cn'
import type { ActivityPoint, DistributionSlice } from '../types'
import { Panel } from './ui'

/** Gridlines are evenly spaced in Figma even though the values aren't (1k → 30k). */
const TICKS = [30_000, 20_000, 10_000, 5_000, 1_000]
const compact = new Intl.NumberFormat('en', { notation: 'compact' })

/** Height (0–1) of a value on the stepped axis, interpolating between gridlines. */
function position(value: number) {
  const ascending = [...TICKS].reverse()
  const step = 1 / (ascending.length - 1)
  if (value <= ascending[0]) return Math.max(0, (value / ascending[0]) * step * 0.5)
  for (let index = 1; index < ascending.length; index++) {
    if (value <= ascending[index]) {
      const [low, high] = [ascending[index - 1], ascending[index]]
      return step * (index - 1) + ((value - low) / (high - low)) * step
    }
  }
  return 1
}

/** "User Activity" / "Forum Activity" bar chart (Figma "distribution"). */
export function ActivityChart({
  title,
  legend,
  points,
  className,
}: {
  title: string
  legend: string
  points: ActivityPoint[]
  className?: string
}) {
  return (
    <Panel className={cn('flex flex-col gap-3 px-5 pt-3 pb-4 sm:px-[26px]', className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-h4 font-semibold text-fg">{title}</h2>
        <p className="flex items-center gap-[7px] text-xs text-fg-muted">
          <span aria-hidden className="h-0.5 w-[22px] rounded-full bg-brand-orange" />
          {legend}
        </p>
      </div>
      <figure className="flex flex-col gap-2" aria-label={`${title} chart`}>
        <div className="relative h-[230px]">
          {TICKS.map((tick, index) => (
            <div
              key={tick}
              className="absolute inset-x-0 flex items-end gap-[5px]"
              style={{ top: `${(index / (TICKS.length - 1)) * 100}%` }}
            >
              <span className="w-[25px] -translate-y-1/2 text-body-s text-fg-muted">
                {compact.format(tick).toLowerCase()}
              </span>
              <span
                aria-hidden
                className="flex-1 -translate-y-1/2 border-t border-dashed border-grey-30 dark:border-hairline"
              />
            </div>
          ))}
          <ol className="absolute inset-y-0 right-0 left-[39px] flex items-end justify-around gap-2">
            {points.map((point, index) => (
              <li key={index} className="flex h-full w-full max-w-[37px] items-end">
                <span
                  title={`${point.label}: ${point.value.toLocaleString()}`}
                  className="block w-full rounded-card bg-linear-to-b from-chart-bar-top to-brand-orange"
                  style={{ height: `${position(point.value) * 100}%` }}
                />
                <span className="sr-only">
                  {point.label}: {point.value.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <ol aria-hidden className="ml-[39px] flex justify-around">
          {points.map((point, index) => (
            <li key={index} className="flex h-[37px] w-full max-w-[37px] items-center justify-center">
              <span className="-rotate-[49deg] text-caption whitespace-nowrap text-fg-muted">{point.label}</span>
            </li>
          ))}
        </ol>
      </figure>
    </Panel>
  )
}

const SLICE_COLORS: Record<DistributionSlice['tone'], string> = {
  blue: 'var(--color-info)',
  orange: 'var(--color-brand-orange)',
  grey: 'var(--color-grey-40)',
  green: 'var(--color-brand-green)',
}

/** "Project distribution" donut with a legend (Figma DonutChart). */
export function DistributionChart({ title, slices }: { title: string; slices: DistributionSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const gap = 4
  // Largest slice first, clockwise from 12 o'clock — as drawn in Figma.
  const segments = [...slices]
    .sort((a, b) => b.value - a.value)
    .map((slice) => ({ slice, length: (slice.value / total) * circumference }))
    .map((segment, index, all) => ({
      ...segment,
      start: all.slice(0, index).reduce((sum, item) => sum + item.length, 0),
    }))

  return (
    <Panel className="flex flex-col gap-6 px-5 pt-[23px] pb-8 sm:px-8">
      <h2 className="text-h4 font-semibold text-fg">{title}</h2>
      <div className="flex flex-col items-center gap-[19px] sm:flex-row sm:justify-center">
        <svg viewBox="0 0 180 180" className="size-[180px] shrink-0 -rotate-90" role="img" aria-label={title}>
          {segments.map(({ slice, length, start }) => {
            const dash = Math.max(0, length - gap)
            return (
              <circle
                key={slice.label}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={SLICE_COLORS[slice.tone]}
                strokeWidth="40"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-start}
              >
                <title>{`${slice.label}: ${((slice.value / total) * 100).toFixed(1)}%`}</title>
              </circle>
            )
          })}
        </svg>
        <ul className="flex w-full max-w-[290px] flex-col gap-[18px]">
          {slices.map((slice) => (
            <li key={slice.label} className="flex items-center justify-between text-body-s text-fg">
              <span className="flex items-center gap-1">
                <span aria-hidden className="size-3 rounded-full" style={{ background: SLICE_COLORS[slice.tone] }} />
                {slice.label}
              </span>
              <span>{((slice.value / total) * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
