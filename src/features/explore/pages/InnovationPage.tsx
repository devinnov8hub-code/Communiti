import { ShareNetwork } from '@phosphor-icons/react'
import { Link, useParams } from 'react-router-dom'
import { PageColumns } from '@/components/layout/AppShell'
import { EmptyState, useToast } from '@/components/ui'
import { RightRail } from '@/features/feed/components/RightRail'
import { getErrorMessage } from '@/lib/api/errors'
import { ExploreHeader } from '../components/ExploreHeader'
import { ImageGallery } from '../components/ImageGallery'
import { exploreTabUrl } from '../urls'
import { useInnovation } from '../hooks/queries'

/** Featured innovation detail (Figma "Featured View"). */
export function InnovationPage() {
  const { innovationId = '' } = useParams()
  const innovation = useInnovation(innovationId)
  const toast = useToast()

  const share = async () => {
    const url = innovation.data?.shareUrl || window.location.href
    try {
      if (navigator.share) await navigator.share({ title: innovation.data?.title, url })
      else {
        await navigator.clipboard.writeText(url)
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
              <ImageGallery key={innovation.data.id} images={innovation.data.gallery} title={innovation.data.title} />

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
