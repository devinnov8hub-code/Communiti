import { ShareNetwork } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageColumns } from '@/components/layout/AppShell'
import { EmptyState, useToast } from '@/components/ui'
import { RightRail } from '@/features/feed/components/RightRail'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { ExploreHeader } from '../components/ExploreHeader'
import { exploreTabUrl } from '../urls'
import { useInnovation } from '../hooks/queries'

/** Featured innovation detail (Figma "Featured View"). */
export function InnovationPage() {
  const { innovationId = '' } = useParams()
  const innovation = useInnovation(innovationId)
  const [active, setActive] = useState(0)
  const toast = useToast()

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: innovation.data?.title, url: window.location.href })
      else {
        await navigator.clipboard.writeText(window.location.href)
        toast('Link copied to clipboard')
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <PageColumns aside={<RightRail />}>
      <ExploreHeader tab="featured" />
      <div className="px-2.5 py-2.5">
        {innovation.isPending ? (
          <div className="h-[500px] animate-pulse bg-surface" />
        ) : innovation.isError ? (
          <EmptyState title="Not found" description={getErrorMessage(innovation.error)} />
        ) : (
          <article className="flex flex-col gap-[27px] px-2 py-[5px]">
            <div className="flex items-center justify-between gap-3">
              <nav aria-label="Breadcrumb" className="min-w-0 flex-1 truncate text-body-l">
                <Link to={exploreTabUrl('featured')} className="text-fg-muted hover:underline">
                  Featured Innovation
                </Link>
                <span className="text-fg"> / {innovation.data.title}</span>
              </nav>
              <button
                type="button"
                onClick={share}
                className="flex items-center gap-2.5 rounded-[4px] border border-border-default bg-popover p-2.5 text-body-m font-semibold text-fg-muted hover:text-fg"
              >
                Share
                <ShareNetwork aria-hidden className="size-[18px]" />
              </button>
            </div>

            <h1 className="text-h3 font-semibold text-brand-green">{innovation.data.title}</h1>

            <div className="flex flex-col gap-gap-md">
              <img
                src={innovation.data.gallery[active]}
                alt={`${innovation.data.title} — image ${active + 1}`}
                className="h-[228px] w-full bg-grey-30 object-cover sm:h-[300px]"
              />

              {/* Image carousel (Figma "Image Carousel") */}
              <div className="flex flex-col items-center gap-2 rounded-control bg-carousel py-3">
                <div className="flex w-full max-w-[582px] gap-2 overflow-x-auto px-3">
                  {innovation.data.gallery.map((src, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Show image ${index + 1}`}
                      aria-current={index === active}
                      onClick={() => setActive(index)}
                      className={cn(
                        'h-[52px] min-w-[72px] flex-1 overflow-hidden rounded-md ring-offset-2 ring-offset-carousel transition',
                        index === active ? 'ring-2 ring-brand-green' : 'opacity-80 hover:opacity-100',
                      )}
                    >
                      <img src={src} alt="" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5" aria-hidden>
                  {innovation.data.gallery.slice(0, 6).map((_, index) => (
                    <span
                      key={index}
                      className={cn('size-1.5 rounded-full', index === active ? 'bg-brand-green' : 'bg-grey-30')}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 text-body-m text-fg">
                {innovation.data.description.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </article>
        )}
      </div>
    </PageColumns>
  )
}
