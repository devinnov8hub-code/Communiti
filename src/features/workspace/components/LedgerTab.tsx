import { CalendarDots } from '@phosphor-icons/react'
import { Spinner } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { formatDayHeading, formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useLedger } from '../hooks/queries'
import type { LedgerEntry, LedgerKind } from '../types'
import { TabState } from './shared'

const KINDS: Record<LedgerKind, { title: string; dot: string; text: string }> = {
  chat: { title: 'Team Chat', dot: 'bg-brand-green', text: 'text-brand-green' },
  research: { title: 'Research Document', dot: 'bg-info', text: 'text-info' },
  review: { title: 'Expert Review', dot: 'bg-warning', text: 'text-warning' },
  prototype: { title: 'Prototype Updated', dot: 'bg-brand-orange', text: 'text-brand-orange' },
  team: { title: 'Team Update', dot: 'bg-info-strong', text: 'text-info-strong dark:text-info' },
}

/** Project activity timeline grouped by day (Figma "Ledger"). */
export function LedgerTab({ projectId }: { projectId: string }) {
  const ledger = useLedger(projectId)

  if (ledger.isPending)
    return (
      <TabState>
        <Spinner className="text-brand-orange" />
      </TabState>
    )
  if (ledger.isError) return <TabState>{getErrorMessage(ledger.error)}</TabState>
  if (ledger.data.length === 0) return <TabState>No activity yet.</TabState>

  const groups = new Map<string, LedgerEntry[]>()
  for (const entry of [...ledger.data].sort((a, b) => b.at.localeCompare(a.at))) {
    const heading = formatDayHeading(entry.at)
    groups.set(heading, [...(groups.get(heading) ?? []), entry])
  }

  return (
    <div className="flex flex-col gap-3 pt-2 lg:px-[107px]">
      {[...groups].map(([heading, entries]) => (
        <section key={heading} aria-label={heading} className="flex flex-col gap-gap-sm">
          <h2 className="flex items-center gap-1.5 text-body-s text-grey-40 dark:text-fg-body">
            <CalendarDots aria-hidden className="size-[18px]" />
            {heading}
          </h2>
          <ol className="flex flex-col gap-2">
            {entries.map((entry) => {
              const kind = KINDS[entry.kind]
              return (
                <li key={entry.id} className="flex gap-1">
                  <span aria-hidden className="flex w-[39px] shrink-0 flex-col items-center">
                    <span className={cn('size-7 shrink-0 rounded-full', kind.dot)} />
                    <span className="w-0.5 flex-1 bg-grey-30 dark:bg-hairline" />
                  </span>
                  <article className="flex min-w-0 flex-1 flex-col gap-3 rounded-card border border-grey-30 bg-surface-raised px-2.5 py-2 dark:border-hairline">
                    <header className="flex items-center justify-between gap-3">
                      <h3 className={cn('text-body-s font-semibold', kind.text)}>{kind.title}</h3>
                      <time dateTime={entry.at} className="shrink-0 text-caption text-grey-40 dark:text-fg-body">
                        {formatTime(entry.at)}
                      </time>
                    </header>
                    <p className="text-caption text-grey-40 dark:text-fg-body">
                      <span className="text-body-s text-fg">{entry.actor}</span> {entry.action}
                    </p>
                    {entry.detail && (
                      <p className="rounded-control bg-offwhite p-2.5 text-caption text-black dark:bg-grey-50 dark:text-fg">
                        {entry.detail}
                      </p>
                    )}
                  </article>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
