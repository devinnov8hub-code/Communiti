import { cn } from '@/lib/cn'
import type { ActivityPoint, DistributionSlice } from '../types'
import { Panel } from './ui'

const compact = new Intl.NumberFormat('en', { notation: 'compact' })
const GRIDLINES = 4
const MAX_LABELS = 10

/** Rounds the largest value up to a tidy axis maximum (7 → 8, 130 → 200, 22 000 → 40 000). */
function axisMax(values: number[]) {
  const max = Math.max(...values, GRIDLINES)
  const step = 10 ** Math.floor(Math.log10(max / GRIDLINES))
  const tidy = [1, 2, 2.5, 5, 10].map((factor) => factor * step).find((size) => size * GRIDLINES >= max) ?? max
  return tidy * GRIDLINES
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
  const max = axisMax(points.map((point) => point.value))
  const ticks = Array.from({ length: GRIDLINES + 1 }, (_, index) => max - (index * max) / GRIDLINES)
  // With many bars (30 days) only every nth date fits under the chart.
  const labelEvery = Math.ceil(points.length / MAX_LABELS)

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
        <div className="relative mt-2 h-[230px]">
          {ticks.map((tick, index) => (
            <div
              key={tick}
              className="absolute inset-x-0 flex items-end gap-[5px]"
              style={{ top: `${(index / GRIDLINES) * 100}%` }}
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
          <ol className="absolute inset-y-0 right-0 left-[39px] flex items-end justify-around gap-1 sm:gap-2">
            {points.map((point, index) => (
              <li key={index} className="flex h-full w-full max-w-[37px] min-w-0 items-end">
                <span
                  title={`${point.label}: ${point.value.toLocaleString()}`}
                  className={cn(
                    'block w-full bg-linear-to-b from-chart-bar-top to-brand-orange',
                    points.length > 12 ? 'rounded-sm' : 'rounded-card',
                  )}
                  // A sliver for small non-zero days so they don't vanish.
                  style={{ height: `${point.value > 0 ? Math.max((point.value / max) * 100, 1.5) : 0}%` }}
                />
                <span className="sr-only">
                  {point.label}: {point.value.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
          {points.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-body-s text-fg-muted">
              No activity in this period yet.
            </p>
          )}
        </div>
        <ol aria-hidden className="ml-[39px] flex justify-around gap-1 sm:gap-2">
          {points.map((point, index) => (
            <li key={index} className="flex h-[37px] w-full max-w-[37px] min-w-0 items-center justify-center">
              {index % labelEvery === 0 && (
                <span className="-rotate-[49deg] text-caption whitespace-nowrap text-fg-muted">{point.label}</span>
              )}
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
