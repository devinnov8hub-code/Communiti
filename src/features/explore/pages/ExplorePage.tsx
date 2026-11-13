import { FadersHorizontal } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PageColumns } from '@/components/layout/AppShell'
import { EmptyState, LoadMore } from '@/components/ui'
import { RightRail } from '@/features/feed/components/RightRail'
import { ExploreHeader } from '../components/ExploreHeader'
import { exploreTabUrl } from '../urls'
import { HighlightsMosaic } from '../components/HighlightsMosaic'
import { InnovationStrip } from '../components/InnovationStrip'
import { PeopleStrip } from '../components/PeopleStrip'
import { SortTopicsModal } from '../components/SortTopicsModal'
import { useHighlights, useInnovations, useSuggestedPeople } from '../hooks/queries'
import type { ExploreTab, Innovation } from '../types'

const isTab = (value: string | null): value is ExploreTab =>
  value === 'suggested' || value === 'highlights' || value === 'featured'

/** Explore (Figma "Explore", "highlights", "Featured"). The tab lives in the URL. */
export function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: ExploreTab = isTab(raw) ? raw : 'suggested'

  return (
    <PageColumns aside={<RightRail />}>
      <ExploreHeader
        tab={tab}
        onChange={(next) => setParams(next === 'suggested' ? {} : { tab: next }, { replace: true })}
      />
      <div className="px-2.5 py-2.5">
        {tab === 'suggested' && <SuggestedTab />}
        {tab === 'highlights' && <HighlightsSection paged />}
        {tab === 'featured' && <FeaturedTab />}
      </div>
    </PageColumns>
  )
}

function SuggestedTab() {
  const innovations = useInnovations()
  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-[27px] overflow-hidden px-2 py-[5px]">
        <header className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-brand-orange">Featured Innovations</h2>
          <Link to={exploreTabUrl('featured')} className="text-body-m text-brand-green hover:underline">
            See All
          </Link>
        </header>
        {innovations.isPending ? (
          <div className="h-[150px] animate-pulse rounded-card bg-surface" />
        ) : innovations.data?.length ? (
          <InnovationStrip innovations={innovations.data} />
        ) : (
          <p className="text-body-m text-fg-muted">No featured innovations yet.</p>
        )}
      </section>
      {/* <SuggestedPeopleSection /> */}
      <HighlightsSection />
    </div>
  )
}

/** People with profiles like yours; hidden when there's nobody to suggest. */
// function SuggestedPeopleSection() {
//   const people = useSuggestedPeople()
//   if (people.isSuccess && people.data.length === 0) return null
//   return (
//     <section className="flex flex-col gap-[27px] overflow-hidden px-2 py-[5px]">
//       <header className="flex items-center justify-between">
//         <h2 className="text-h3 font-semibold text-brand-orange">Suggested people</h2>
//       </header>
//       {people.isPending ? (
//         <div className="h-[190px] animate-pulse rounded-card bg-surface" />
//       ) : people.isError ? (
//         <p className="text-body-m text-fg-muted">Couldn’t load suggestions right now.</p>
//       ) : (
//         <PeopleStrip people={people.data} />
//       )}
//     </section>
//   )
// }

/** The Suggested tab shows the first page; the Highlights tab keeps loading as you scroll. */
function HighlightsSection({ paged = false }: { paged?: boolean }) {
  const highlights = useHighlights()
  const items = highlights.data ?? []
  return (
    <section className="flex flex-col gap-3 px-2">
      <h2 className="text-h3 font-semibold text-brand-orange">Communiti Highlights</h2>
      {highlights.isPending ? (
        <div className="h-[400px] animate-pulse rounded-md bg-surface" />
      ) : items.length ? (
        <>
          <HighlightsMosaic highlights={items} />
          {paged && highlights.hasNextPage && (
            <LoadMore
              key={items.length}
              onVisible={() => !highlights.isFetchingNextPage && highlights.fetchNextPage()}
            />
          )}
        </>
      ) : (
        <p className="text-body-m text-fg-muted">No highlights yet.</p>
      )}
    </section>
  )
}

function FeaturedTab() {
  const [topics, setTopics] = useState<string[]>([])
  const [sortOpen, setSortOpen] = useState(false)
  const innovations = useInnovations(topics)

  return (
    <section className="flex flex-col gap-[27px] px-2 py-[5px]">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-h3 font-semibold text-fg">Featured Innovation</h2>
        <button
          type="button"
          onClick={() => setSortOpen(true)}
          className="flex items-center gap-2.5 rounded-[4px] border border-border-default bg-popover p-2.5 text-body-m font-semibold text-fg-muted hover:text-fg"
        >
          Sort topics{topics.length > 0 && ` (${topics.length})`}
          <FadersHorizontal aria-hidden className="size-[18px]" />
        </button>
      </header>

      {innovations.isPending ? (
        <div className="h-[400px] animate-pulse bg-surface" />
      ) : innovations.data?.length ? (
        <ul className="flex flex-col gap-gap-md">
          {innovations.data.map((innovation) => (
            <li key={innovation.id}>
              <FeaturedCard innovation={innovation} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No innovations for these topics" description="Try choosing different topics." />
      )}

      {sortOpen && <SortTopicsModal open selected={topics} onApply={setTopics} onClose={() => setSortOpen(false)} />}
    </section>
  )
}

function FeaturedCard({ innovation }: { innovation: Innovation }) {
  return (
    <Link
      to={paths.innovation(innovation.id)}
      className="group flex flex-col gap-[7px] border-b border-hairline px-3 py-2.5"
    >
      {innovation.coverUrl ? (
        <img src={innovation.coverUrl} alt="" loading="lazy" className="h-[200px] w-full object-cover sm:h-[272px]" />
      ) : (
        <span aria-hidden className="h-[200px] w-full bg-surface sm:h-[272px]" />
      )}
      <span className="text-body-m font-semibold text-brand-green group-hover:underline">{innovation.title}</span>
      <span className="line-clamp-3 text-body-m font-semibold text-fg-muted">{innovation.description[0]}</span>
    </Link>
  )
}
