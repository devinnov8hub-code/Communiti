import { Link, useParams } from 'react-router-dom'
import { PageColumns } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/ui'
import { RightRail } from '@/features/feed/components/RightRail'
import { getErrorMessage } from '@/lib/api/errors'
import { ExploreHeader } from '../components/ExploreHeader'
import { exploreTabUrl } from '../urls'
import { HighlightsMosaic } from '../components/HighlightsMosaic'
import { useHighlight, useHighlights } from '../hooks/queries'

/** Expanded highlight with "More like this" (Figma " expand image"). */
export function HighlightPage() {
  const { highlightId = '' } = useParams()
  const highlight = useHighlight(highlightId)
  const more = useHighlights()

  return (
    <PageColumns aside={<RightRail />}>
      <ExploreHeader tab="highlights" />
      <div className="flex flex-col gap-3.5 px-2.5 pt-3.5 pb-2.5">
        {highlight.isPending ? (
          <div className="h-[400px] animate-pulse bg-surface" />
        ) : highlight.isError ? (
          <EmptyState title="Not found" description={getErrorMessage(highlight.error)} />
        ) : (
          <>
            <nav aria-label="Breadcrumb" className="text-body-l text-fg-muted">
              <Link to={exploreTabUrl('highlights')} className="hover:underline">
                Community Highlights
              </Link>
              {' > '}
              <span className="text-fg">{highlight.data.title}</span>
            </nav>
            <div className="flex flex-col gap-gap-md">
              <figure className="flex flex-col gap-3.5 border-b border-hairline py-2.5">
                <img
                  src={highlight.data.imageUrl}
                  alt={highlight.data.title}
                  className="h-[260px] w-full object-cover sm:h-[353px]"
                />
                <figcaption className="text-h3 font-semibold text-innovation">{highlight.data.title}</figcaption>
              </figure>
              <section className="flex flex-col gap-[13px]">
                <h2 className="text-body-m font-semibold text-brand-orange">More like this</h2>
                {more.data && <HighlightsMosaic highlights={more.data.filter((item) => item.id !== highlightId)} />}
              </section>
            </div>
          </>
        )}
      </div>
    </PageColumns>
  )
}
